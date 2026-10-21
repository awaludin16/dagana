<?php

namespace Tests\Feature\Api;

use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\MemberInvitation;
use App\Domain\Organization\Models\Membership;
use App\Domain\Outlet\Models\Outlet;
use App\Mail\MemberInvitationMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Covers employee/membership management: permission granted, permission denied,
 * inactive membership, outlet-scoped access, and cross-tenant isolation.
 */
class MemberManagementTest extends TestCase
{
    use RefreshDatabase;

    private function ownerOf(Business $business): User
    {
        $owner = User::factory()->create();

        Membership::factory()
            ->forBusiness($business)
            ->forUser($owner)
            ->role(RolePreset::Owner)
            ->create();

        return $owner;
    }

    private function memberOf(Business $business, RolePreset $role): User
    {
        $user = User::factory()->create();

        Membership::factory()
            ->forBusiness($business)
            ->forUser($user)
            ->role($role)
            ->create();

        return $user;
    }

    public function test_owner_can_list_members(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);

        $response = $this->actingAs($owner)->getJson("/api/v1/businesses/{$business->id}/members");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.role', RolePreset::Owner->value)
            ->assertJsonPath('data.0.role_label', 'Owner')
            ->assertJsonPath('data.0.user.email', $owner->email)
            ->assertJsonPath('meta.current_page', 1);
    }

    public function test_member_without_employees_read_cannot_list_members(): void
    {
        $business = Business::factory()->create();
        $this->ownerOf($business);

        $cashier = $this->memberOf($business, RolePreset::Cashier);

        $this->actingAs($cashier)
            ->getJson("/api/v1/businesses/{$business->id}/members")
            ->assertForbidden();
    }

    public function test_owner_can_invite_unregistered_email_and_user_accepts_with_assigned_access(): void
    {
        Mail::fake();
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $outlet = Outlet::factory()->for($business)->create();

        $response = $this->actingAs($owner)->postJson("/api/v1/businesses/{$business->id}/invitations", [
            'email' => 'employee@dagana.test',
            'role' => RolePreset::Cashier->value,
            'outlet_ids' => [$outlet->id],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.role', RolePreset::Cashier->value)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.email', 'employee@dagana.test')
            ->assertJsonMissingPath('data.token_hash');

        $this->assertDatabaseCount('memberships', 1);
        $this->assertDatabaseHas('member_invitations', [
            'id' => $response->json('data.id'),
            'business_id' => $business->id,
            'email' => 'employee@dagana.test',
            'status' => 'pending',
            'delivery_status' => 'sent',
        ]);

        $token = null;
        Mail::assertSent(MemberInvitationMail::class, function (MemberInvitationMail $mail) use (&$token): bool {
            $token = $mail->token;

            return $mail->hasTo('employee@dagana.test');
        });
        $this->assertNotNull($token);

        $employee = User::factory()->create(['email' => 'employee@dagana.test']);
        $accept = $this->actingAs($employee)->postJson('/api/v1/invitations/accept', ['token' => $token]);

        $accept->assertCreated()
            ->assertJsonPath('data.role', RolePreset::Cashier->value)
            ->assertJsonPath('data.status', Membership::STATUS_ACTIVE)
            ->assertJsonPath('data.outlets.0.id', $outlet->id);
        $this->assertDatabaseHas('memberships', [
            'id' => $accept->json('data.id'),
            'user_id' => $employee->id,
            'status' => Membership::STATUS_ACTIVE,
        ]);
        $this->actingAs($employee)
            ->postJson('/api/v1/invitations/accept', ['token' => $token])
            ->assertUnprocessable();
    }

    public function test_owner_membership_invitation_ignores_explicit_outlet_grants(): void
    {
        Mail::fake();
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $outlet = Outlet::factory()->for($business)->create();

        $response = $this->actingAs($owner)->postJson("/api/v1/businesses/{$business->id}/invitations", [
            'email' => 'second-owner@dagana.test',
            'role' => RolePreset::Owner->value,
            'outlet_ids' => [$outlet->id],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.role', RolePreset::Owner->value);
        $invitation = MemberInvitation::query()
            ->findOrFail($response->json('data.id'));
        $this->assertSame([], $invitation->outlet_ids);
    }

    public function test_invitation_acceptance_requires_matching_authenticated_email(): void
    {
        Mail::fake();
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/invitations", [
                'email' => 'invited@dagana.test',
                'role' => RolePreset::Cashier->value,
            ])
            ->assertCreated();
        $token = null;
        Mail::assertSent(MemberInvitationMail::class, function (MemberInvitationMail $mail) use (&$token): bool {
            $token = $mail->token;

            return true;
        });

        $wrongUser = User::factory()->create(['email' => 'someone-else@dagana.test']);
        $this->actingAs($wrongUser)
            ->postJson('/api/v1/invitations/accept', ['token' => $token])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('token');
    }

    public function test_invitations_are_paginated_and_cancelled_invitations_cannot_be_used(): void
    {
        Mail::fake();
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $first = $this->actingAs($owner)->postJson("/api/v1/businesses/{$business->id}/invitations", [
            'email' => 'first@dagana.test',
            'role' => RolePreset::Staff->value,
        ])->assertCreated();
        $second = $this->actingAs($owner)->postJson("/api/v1/businesses/{$business->id}/invitations", [
            'email' => 'second@dagana.test',
            'role' => RolePreset::Staff->value,
        ])->assertCreated();

        $this->actingAs($owner)
            ->getJson("/api/v1/businesses/{$business->id}/invitations?per_page=1&page=2")
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonCount(1, 'data');

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/invitations/{$first->json('data.id')}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'canceled');

        $token = null;
        Mail::assertSent(MemberInvitationMail::class, function (MemberInvitationMail $mail) use (&$token): bool {
            if ($mail->invitation->email === 'first@dagana.test') {
                $token = $mail->token;
            }

            return true;
        });
        $recipient = User::factory()->create(['email' => 'first@dagana.test']);
        $this->actingAs($recipient)
            ->postJson('/api/v1/invitations/accept', ['token' => $token])
            ->assertUnprocessable();

        $this->assertDatabaseHas('member_invitations', [
            'id' => $second->json('data.id'),
            'status' => 'pending',
        ]);
    }

    public function test_resending_an_invitation_rotates_and_invalidates_its_previous_token(): void
    {
        Mail::fake();
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $invitation = $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/invitations", [
                'email' => 'resend@dagana.test',
                'role' => RolePreset::Staff->value,
            ])
            ->assertCreated();

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/invitations/{$invitation->json('data.id')}/resend")
            ->assertOk()
            ->assertJsonPath('data.delivery_status', 'sent');

        $tokens = [];
        Mail::assertSent(MemberInvitationMail::class, function (MemberInvitationMail $mail) use (&$tokens): bool {
            if ($mail->invitation->email === 'resend@dagana.test') {
                $tokens[] = $mail->token;
            }

            return true;
        });
        $this->assertCount(2, $tokens);
        $this->assertNotSame($tokens[0], $tokens[1]);

        $recipient = User::factory()->create(['email' => 'resend@dagana.test']);
        $this->actingAs($recipient)
            ->postJson('/api/v1/invitations/accept', ['token' => $tokens[0]])
            ->assertUnprocessable();
        $this->actingAs($recipient)
            ->postJson('/api/v1/invitations/accept', ['token' => $tokens[1]])
            ->assertCreated();
    }

    public function test_adding_existing_member_is_rejected(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $existing = $this->memberOf($business, RolePreset::Cashier);

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/invitations", [
                'email' => $existing->email,
                'role' => RolePreset::Staff->value,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('memberships', 2);
    }

    public function test_adding_employee_with_outlet_from_another_business_is_rejected(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $foreignOutlet = Outlet::factory()->create();
        $employee = User::factory()->create();

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/invitations", [
                'email' => 'unknown@dagana.test',
                'role' => RolePreset::Cashier->value,
                'outlet_ids' => [$foreignOutlet->id],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('outlet_ids.0');

        $this->assertDatabaseCount('member_invitations', 0);
    }

    public function test_disabled_outlets_cannot_be_assigned_to_members_or_invitations(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $disabledOutlet = Outlet::factory()
            ->for($business)
            ->create(['status' => Outlet::STATUS_DISABLED]);

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/invitations", [
                'email' => 'candidate@dagana.test',
                'role' => RolePreset::Staff->value,
                'outlet_ids' => [$disabledOutlet->id],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('outlet_ids.0');

        $employee = $this->memberOf($business, RolePreset::Staff);
        $membership = $employee->membershipFor($business);

        $this->actingAs($owner)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$membership->id}", [
                'outlet_ids' => [$disabledOutlet->id],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('outlet_ids.0');

        $this->assertDatabaseMissing('membership_outlet', [
            'membership_id' => $membership->id,
            'outlet_id' => $disabledOutlet->id,
        ]);
    }

    public function test_invalid_role_is_rejected(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/invitations", [
                'email' => 'candidate@dagana.test',
                'role' => 'superadmin',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('role');
    }

    public function test_member_without_employees_create_cannot_add_employee(): void
    {
        $business = Business::factory()->create();
        $this->ownerOf($business);
        $cashier = $this->memberOf($business, RolePreset::Cashier);
        $this->actingAs($cashier)
            ->postJson("/api/v1/businesses/{$business->id}/invitations", [
                'email' => 'candidate@dagana.test',
                'role' => RolePreset::Staff->value,
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('member_invitations', 0);
    }

    public function test_owner_can_update_employee_role_and_outlets(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $outlet = Outlet::factory()->for($business)->create();
        $employee = $this->memberOf($business, RolePreset::Staff);
        $membership = $employee->membershipFor($business);

        $this->actingAs($owner)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$membership->id}", [
                'role' => RolePreset::Manager->value,
                'outlet_ids' => [$outlet->id],
            ])
            ->assertOk()
            ->assertJsonPath('data.role', RolePreset::Manager->value)
            ->assertJsonPath('data.outlets.0.id', $outlet->id);

        $this->assertDatabaseHas('memberships', [
            'id' => $membership->id,
            'role' => RolePreset::Manager->value,
        ]);
        $this->assertDatabaseHas('membership_outlet', [
            'membership_id' => $membership->id,
            'outlet_id' => $outlet->id,
        ]);
    }

    public function test_member_without_employees_update_cannot_change_role(): void
    {
        $business = Business::factory()->create();
        $this->ownerOf($business);
        $cashier = $this->memberOf($business, RolePreset::Cashier);
        $target = $this->memberOf($business, RolePreset::Staff);
        $targetMembership = $target->membershipFor($business);

        $this->actingAs($cashier)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$targetMembership->id}", [
                'role' => RolePreset::Manager->value,
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('memberships', [
            'id' => $targetMembership->id,
            'role' => RolePreset::Staff->value,
        ]);
    }

    public function test_owner_can_disable_employee_and_employee_loses_business_access(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $employee = $this->memberOf($business, RolePreset::Cashier);
        $membership = $employee->membershipFor($business);

        $this->actingAs($employee)->getJson("/api/v1/businesses/{$business->id}")->assertOk();

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/members/{$membership->id}/disable")
            ->assertOk()
            ->assertJsonPath('data.status', Membership::STATUS_DISABLED);

        $this->actingAs($employee)
            ->getJson("/api/v1/businesses/{$business->id}")
            ->assertNotFound();
    }

    public function test_owner_can_reenable_employee(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $employee = $this->memberOf($business, RolePreset::Cashier);
        $membership = $employee->membershipFor($business);

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/members/{$membership->id}/disable")
            ->assertOk();

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/members/{$membership->id}/enable")
            ->assertOk()
            ->assertJsonPath('data.status', Membership::STATUS_ACTIVE);

        $this->actingAs($employee)
            ->getJson("/api/v1/businesses/{$business->id}")
            ->assertOk();
    }

    public function test_cannot_disable_last_owner(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $membership = $owner->membershipFor($business);

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/members/{$membership->id}/disable")
            ->assertStatus(409);

        $this->assertDatabaseHas('memberships', [
            'id' => $membership->id,
            'status' => Membership::STATUS_ACTIVE,
        ]);
    }

    public function test_cannot_demote_last_owner(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $membership = $owner->membershipFor($business);

        $this->actingAs($owner)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$membership->id}", [
                'role' => RolePreset::Manager->value,
            ])
            ->assertStatus(409);

        $this->assertDatabaseHas('memberships', [
            'id' => $membership->id,
            'role' => RolePreset::Owner->value,
        ]);
    }

    public function test_owner_can_demote_when_another_active_owner_exists(): void
    {
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $secondOwner = $this->memberOf($business, RolePreset::Owner);
        $secondMembership = $secondOwner->membershipFor($business);

        $this->actingAs($owner)
            ->patchJson("/api/v1/businesses/{$business->id}/members/{$secondMembership->id}", [
                'role' => RolePreset::Manager->value,
            ])
            ->assertOk();

        $this->assertDatabaseHas('memberships', [
            'id' => $secondMembership->id,
            'role' => RolePreset::Manager->value,
        ]);
    }

    public function test_cannot_manage_membership_of_another_business(): void
    {
        $businessA = Business::factory()->create();
        $ownerA = $this->ownerOf($businessA);

        $businessB = Business::factory()->create();
        $ownerB = $this->ownerOf($businessB);
        $membershipB = $ownerB->membershipFor($businessB);

        $this->actingAs($ownerA)
            ->patchJson("/api/v1/businesses/{$businessA->id}/members/{$membershipB->id}", [
                'role' => RolePreset::Manager->value,
            ])
            ->assertNotFound();

        $this->actingAs($ownerA)
            ->postJson("/api/v1/businesses/{$businessA->id}/members/{$membershipB->id}/disable")
            ->assertNotFound();

        $this->assertDatabaseHas('memberships', [
            'id' => $membershipB->id,
            'role' => RolePreset::Owner->value,
            'status' => Membership::STATUS_ACTIVE,
        ]);
    }

    public function test_employee_can_only_view_outlets_they_are_granted(): void
    {
        Mail::fake();
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);
        $grantedOutlet = Outlet::factory()->for($business)->create();
        $otherOutlet = Outlet::factory()->for($business)->create();

        $response = $this->actingAs($owner)->postJson("/api/v1/businesses/{$business->id}/invitations", [
            'email' => 'outlet-member@dagana.test',
            'role' => RolePreset::Cashier->value,
            'outlet_ids' => [$grantedOutlet->id],
        ]);

        $response->assertCreated();
        $token = null;
        Mail::assertSent(MemberInvitationMail::class, function (MemberInvitationMail $mail) use (&$token): bool {
            $token = $mail->token;

            return true;
        });
        $employee = User::factory()->create(['email' => 'outlet-member@dagana.test']);

        $this->actingAs($employee)
            ->postJson('/api/v1/invitations/accept', ['token' => $token])
            ->assertCreated();

        $this->actingAs($employee)
            ->getJson("/api/v1/outlets/{$grantedOutlet->id}")
            ->assertOk();

        $this->actingAs($employee)
            ->getJson("/api/v1/outlets/{$otherOutlet->id}")
            ->assertNotFound();
    }

    public function test_owner_retains_operational_access_after_employee_is_added(): void
    {
        Mail::fake();
        $business = Business::factory()->create();
        $owner = $this->ownerOf($business);

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/invitations", [
                'email' => 'operational-member@dagana.test',
                'role' => RolePreset::Cashier->value,
            ])
            ->assertCreated();
        $token = null;
        Mail::assertSent(MemberInvitationMail::class, function (MemberInvitationMail $mail) use (&$token): bool {
            $token = $mail->token;

            return true;
        });
        $employee = User::factory()->create(['email' => 'operational-member@dagana.test']);
        $this->actingAs($employee)
            ->postJson('/api/v1/invitations/accept', ['token' => $token])
            ->assertCreated();

        // Employee setup must not lock the owner out of the business context.
        $this->actingAs($owner)
            ->getJson("/api/v1/businesses/{$business->id}")
            ->assertOk();

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/outlets", ['name' => 'Outlet Kedua'])
            ->assertCreated();
    }
}
