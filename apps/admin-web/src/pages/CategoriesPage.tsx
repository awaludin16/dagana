import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Pencil, Plus, Tags } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { type ApiFieldErrors, extractFieldErrors } from '../lib/api'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Skeleton } from '../components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type Category,
} from '../lib/catalog'
import { usePermissions } from '../lib/permissions'

function FieldError({ text }: { text: string | undefined }) {
  if (!text) return null
  return <p className="text-xs text-destructive">{text}</p>
}

export default function CategoriesPage() {
  const qc = useQueryClient()
  const { can } = usePermissions()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [formName, setFormName] = useState('')
  const [formSort, setFormSort] = useState('0')
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({})
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { name: formName.trim(), sort_order: Number(formSort || 0) }
      return editing ? updateCategory(editing.id, payload) : createCategory(payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Kategori diperbarui.' : 'Kategori dibuat.')
      qc.invalidateQueries({ queryKey: ['categories'] })
      setDialogOpen(false)
    },
    onError: (error) => setFieldErrors(extractFieldErrors(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (category: Category) => deleteCategory(category.id),
    onSuccess: (_data, category) => {
      toast.success(`Kategori “${category.name}” dihapus.`)
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      setPendingDelete(null)
    },
    onError: () => {
      toast.error('Gagal menghapus kategori. Coba lagi.')
      setPendingDelete(null)
    },
  })

  function openCreate() {
    setEditing(null)
    setFormName('')
    setFormSort('0')
    setFieldErrors({})
    setDialogOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setFormName(category.name)
    setFormSort(String(category.sort_order))
    setFieldErrors({})
    setDialogOpen(true)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!formName.trim()) {
      setFieldErrors({ name: ['Nama kategori wajib diisi.'] })
      return
    }
    setFieldErrors({})
    saveMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Kategori</h1>
          <p className="text-sm text-muted-foreground">
            Kategorikan produk agar mudah dikelola dan ditemukan.
          </p>
        </div>
        {can('categories.create') && (
          <Button onClick={openCreate}>
            <Plus aria-hidden />
            Tambah Kategori
          </Button>
        )}
      </header>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : isError ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm text-destructive">Gagal memuat kategori.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <Tags className="size-5" aria-hidden />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">Belum ada kategori</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Buat kategori pertama untuk mulai mengelompokkan produk.
          </p>
          {can('categories.create') && (
            <Button size="sm" className="mt-4" onClick={openCreate}>
              Tambah Kategori
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori</TableHead>
                <TableHead className="w-20">Urutan</TableHead>
                <TableHead className="w-20 text-right">Produk</TableHead>
                <TableHead className="w-12 text-right" aria-label="Aksi" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium text-foreground">{category.name}</TableCell>
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {category.sort_order}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {category.products_count ?? 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Aksi kategori">
                          <MoreHorizontal aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {can('categories.update') && (
                          <DropdownMenuItem onClick={() => openEdit(category)}>
                            <Pencil aria-hidden />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {can('categories.delete') && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setPendingDelete(category)}
                          >
                            Hapus
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit kategori' : 'Tambah kategori'}</DialogTitle>
              <DialogDescription>
                Urutan kecil tampil lebih awal di daftar produk & katalog.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Nama</Label>
                <Input
                  id="category-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="cth. Minuman"
                  aria-invalid={Boolean(fieldErrors.name)}
                />
                <FieldError text={fieldErrors.name?.[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-sort">Urutan</Label>
                <Input
                  id="category-sort"
                  type="number"
                  min="0"
                  value={formSort}
                  onChange={(e) => setFormSort(e.target.value)}
                />
                <FieldError text={fieldErrors.sort_order?.[0]} />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Menyimpan…' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus kategori?</DialogTitle>
            <DialogDescription>
              Produk di kategori “{pendingDelete?.name}” akan menjadi tanpa kategori. Tindakan ini
              tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete)}
              disabled={deleteMutation.isPending}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}