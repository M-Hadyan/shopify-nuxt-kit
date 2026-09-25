import type {
  AbandonedCart, Coupon, CouponInput, Customer, Order, Product, ProductUpdate, Review, StoreInfo,
} from '#shared/types'

export interface ListOptions { page?: number; perPage?: number; search?: string }

// الواجهة الموحدة للتعامل مع متجر سلة (حقيقي أو تجريبي)
export interface SallaApi {
  getStoreInfo(): Promise<StoreInfo>
  listProducts(opts?: ListOptions): Promise<Product[]>
  getProduct(id: string): Promise<Product>
  updateProduct(id: string, patch: ProductUpdate): Promise<Product>
  listOrders(opts?: ListOptions): Promise<Order[]>
  listCustomers(opts?: ListOptions): Promise<Customer[]>
  listAbandonedCarts(opts?: ListOptions): Promise<AbandonedCart[]>
  listReviews(opts?: ListOptions): Promise<Review[]>
  listCoupons(opts?: ListOptions): Promise<Coupon[]>
  createCoupon(input: CouponInput): Promise<Coupon>
}
