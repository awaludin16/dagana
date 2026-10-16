export interface PosProduct {
  id: string
  name: string
  price: number
  category?: string
  available: boolean
}

export const posProducts: PosProduct[] = [
  { id: 'p1', name: 'Kopi Susu', price: 18000, category: 'Minuman', available: true },
  { id: 'p2', name: 'Americano', price: 15000, category: 'Minuman', available: true },
  { id: 'p3', name: 'Nasi Goreng', price: 25000, category: 'Makanan', available: true },
  { id: 'p4', name: 'Mie Goreng', price: 20000, category: 'Makanan', available: true },
  { id: 'p5', name: 'Teh Tarik', price: 12000, category: 'Minuman', available: true },
  { id: 'p6', name: 'Roti Bakar', price: 8000, category: 'Snack', available: true },
]

export const categories = ['Semua', 'Makanan', 'Minuman', 'Snack']
