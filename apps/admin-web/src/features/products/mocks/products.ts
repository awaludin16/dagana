export interface Product {
  id: string
  name: string
  price: number
  category?: string
  stock: number
  active: boolean
}

export const products: Product[] = [
  { id: 'p1', name: 'Kopi Susu', price: 18000, category: 'Minuman', stock: 24, active: true },
  { id: 'p2', name: 'Americano', price: 15000, category: 'Minuman', stock: 15, active: true },
  { id: 'p3', name: 'Nasi Goreng', price: 25000, category: 'Makanan', stock: 8, active: true },
  { id: 'p4', name: 'Mie Goreng', price: 20000, category: 'Makanan', stock: 12, active: true },
  { id: 'p5', name: 'Teh Tarik', price: 12000, category: 'Minuman', stock: 3, active: true },
]
