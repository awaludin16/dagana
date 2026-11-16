<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;

/**
 * Composite address stored on Outlet.
 */
final class Address
{
    /** @var list<string> */
    public const FIELDS = ['street', 'village', 'district', 'regency', 'province', 'postal_code'];

    /**
     * Validation rules for the composite address.
     *
     * Required mode (create): the address object and every component are mandatory.
     * Partial mode (PATCH): the address object may be omitted, but when it is
     * sent, every component must be filled — no half-updated addresses.
     *
     * @return array<string, list<string>>
     */
    public static function rules(string $prefix = 'address', bool $required = false): array
    {
        $rules = $required
            ? [$prefix => ['required', 'array']]
            : [$prefix => ['sometimes', 'nullable', 'array']];

        foreach (self::FIELDS as $field) {
            $rules["{$prefix}.{$field}"] = [
                $required ? 'required' : "required_with:{$prefix}",
                'string',
                $field === 'postal_code' ? 'max:10' : 'max:255',
            ];
        }

        return $rules;
    }

    /**
     * @param  array<string, mixed>|null  $address
     * @return array<string, string|null>
     */
    public static function attributes(?array $address): array
    {
        if ($address === null) {
            return [];
        }

        return array_intersect_key($address, array_flip(self::FIELDS));
    }

    /**
     * Flatten a validated nested address into model columns.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public static function merge(array $data, string $key = 'address'): array
    {
        if (! array_key_exists($key, $data)) {
            return $data;
        }

        $attributes = self::attributes($data[$key]);
        unset($data[$key]);

        return array_merge($data, $attributes);
    }

    /**
     * @return array<string, string|null>
     */
    public static function from(Model $model): array
    {
        return collect(self::FIELDS)
            ->mapWithKeys(fn (string $field): array => [$field => $model->getAttribute($field)])
            ->all();
    }
}
