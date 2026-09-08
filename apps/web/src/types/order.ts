export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export type OrderItem = {
  id: string;
  productVariantId: string;
  productName: string;
  variantDescription: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
};

export type OrderAddress = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  district: string;
  postalCode: string;
  country: string;
};

export type OrderPayment = {
  id: string;
  provider: string;
  status: PaymentStatus;
  amount: string;
  transactionReference: string | null;
};

export type Order = {
  id: string;
  status: OrderStatus;
  subtotal: string;
  shippingFee: string;
  total: string;
  shippingAddress: OrderAddress;
  items: OrderItem[];
  payment: OrderPayment | null;
  createdAt: string;
};