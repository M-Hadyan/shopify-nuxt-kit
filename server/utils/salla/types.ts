import type {
  AbandonedCart, Coupon, Customer, Order, Product, Review, StoreInfo,
} from '#shared/types'

export interface ListOptions { page?: number; perPage?: number; search?: string }

// الواجهة الموحدة لقراءة بيانات متجر سلة (حقيقي أو تجريبي)
export interface SallaApi {
  getStoreInfo(): Promise<StoreInfo>
  listProducts(opts?: ListOptions): Promise<Product[]>
  getProduct(id: string): Promise<Product>
  listOrders(opts?: ListOptions): Promise<Order[]>
  listCustomers(opts?: ListOptions): Promise<Customer[]>
  listAbandonedCarts(opts?: ListOptions): Promise<AbandonedCart[]>
  listReviews(opts?: ListOptions): Promise<Review[]>
  listCoupons(opts?: ListOptions): Promise<Coupon[]>
}
