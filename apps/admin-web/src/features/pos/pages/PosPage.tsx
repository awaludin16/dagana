import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProductCard } from '../components/ProductCard'
import { CartSheet } from '../components/CartSheet'
import { posProducts, categories, type PosProduct } from '../mocks/products'

export interface CartItem extends PosProduct {
  qty: number
}

export function PosPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [cart, setCart] = useState<CartItem[]>([])

  const filtered = posProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'Semua' || product.category === activeCategory
    return matchesSearch && matchesCategory && product.available
  })

  const addToCart = (product: PosProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const inc = (id: string) => {
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item)))
  }

  const dec = (id: string) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0)
    )
  }

  const remove = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const checkout = () => {
    setCart([])
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const count = cart.reduce((sum, item) => sum + item.qty, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">POS</h1>
          <p className="text-sm text-muted-foreground">Pilih produk untuk menambahkan ke keranjang.</p>
        </div>
        <CartSheet
          items={cart}
          onInc={inc}
          onDec={dec}
          onRemove={remove}
          onCheckout={checkout}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={addToCart} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Tidak ada produk yang cocok.</p>
      )}
      <div className="lg:hidden sticky bottom-16 mt-auto rounded-lg border bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{count} item</p>
            <p className="text-sm font-semibold tabular-nums">
              Rp {total.toLocaleString('id-ID')}
            </p>
          </div>
          <CartSheet
            items={cart}
            onInc={inc}
            onDec={dec}
            onRemove={remove}
            onCheckout={checkout}
          />
        </div>
      </div>
    </div>
  )
}
