import { ShieldCheck } from 'lucide-react'

import { permissionLabel } from '@/lib/permission-labels'
import type { RoleCatalog } from '@/types'

import { RoleBadge } from './RoleBadge'

export function RoleAccessSummary({ roles }: { roles: RoleCatalog[] }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
        <div>
          <h2 className="text-section-title">Ringkasan role &amp; hak akses</h2>
          <p className="text-sm text-muted-foreground">
            Hak akses berikut berasal dari backend. Role adalah preset, bukan kustomisasi bebas.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((role) => (
          <article key={role.role} className="rounded-xl border bg-card p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <RoleBadge role={role.role} />
              <span className="text-xs text-muted-foreground">{role.permissions.length} izin</span>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {role.permissions.map((permission) => (
                <li
                  key={permission}
                  className="rounded-md bg-muted px-2 py-1 text-[0.6875rem] text-muted-foreground"
                >
                  {permissionLabel(permission)}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
