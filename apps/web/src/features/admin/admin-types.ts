export type AdminPagination = { 
    page: number; 
    limit: number; 
    total: number; 
    totalPages: number; 
    hasNextPage?: boolean; 
    hasPreviousPage?: boolean 
};

export type AdminDashboard = {
  products: number;
  customers: number;
  orders: number;
  revenue: string;
  lowStock: number;

  orderStatuses: Array<{
    status: string;
    count: number;
  }>;

  paymentStatuses: Array<{
    status: string;
    count: number;
  }>;

  monthlyRevenue: Array<{
    label: string;
    revenue: string;
  }>;
};

export type AdminCategory = {
  id: string;
  parentId: string | null;

  name: string;
  slug: string;
  description: string | null;

  cardImageUrl: string | null;
  animationImageUrl: string | null;
  bannerImageUrl: string | null;

  isActive: boolean;

  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;

  children?: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  }[];

  _count?: {
    products: number;
    children: number;
  };
};

export type AdminVariant = {
  id?: string;
  sku: string;
  size: string;
  color: string;
  price: string;
  discountedPrice: string | null;
  quantity: number;
  isActive: boolean;
};

export type AdminProduct = { 
    id: string; 
    name: string; 
    slug: string; 
    description: string | null; 
    isNew: boolean; 
    isActive: boolean; 
    category: { id: string; name: string; slug: string }; 
    images: { id: string; imageUrl: string; altText: string | null; sortOrder: number }[]; 
    variants: AdminVariant[]; 
    createdAt: string 
};

export type AdminProductList = { 
    products: AdminProduct[]; 
    pagination: AdminPagination 
};

export type AdminCategoryList = { 
    categories: AdminCategory[]; 
    pagination: AdminPagination 
};

export type AdminInventoryRow = { 
    id: string; 
    quantity: number; 
    variant: { id: string; sku: string; size: string; color: string; product: { id: string; name: string } } 
};

export type AdminInventoryList = { 
    inventory: AdminInventoryRow[]; 
    pagination: AdminPagination 
};

export type AdminOrderItem = { 
    id: string; 
    productName: string; 
    quantity: number; 
    unitPrice: string 
};

export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type AdminRefundStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED";

export type AdminPaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type AdminPaymentRefund = {
  id: string;
  paymentId: string;
  status: AdminRefundStatus;
  amount: string;
  currency: string;
  providerRefundId: string | null;
  reason: string;
  adminNote: string | null;
  idempotencyKey: string;
  metadata: unknown;
  initiatedById: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type AdminPayment = {
  id: string;
  orderId: string;
  provider: string;
  status: AdminPaymentStatus;

  /*
   * ClothingMart's authoritative order/payment amount.
   * Currently stored in LKR.
   */
  amount: string;
  currency: string;

  providerPaymentId: string | null;
  providerOrderId: string | null;
  transactionReference: string | null;

  metadata: unknown;

  createdAt: string;
  updatedAt: string;

  refunds?: AdminPaymentRefund[];
};

export type AdminCreateRefundInput = {
  amount?: string;

  reason:
    | "CUSTOMER_REQUEST"
    | "DUPLICATE_PAYMENT"
    | "ORDER_ISSUE"
    | "PRODUCT_ISSUE"
    | "OTHER";

  adminNote?: string;

  idempotencyKey: string;
};

export type AdminOrder = { 
    id: string; 
    status: OrderStatus; 
    total: string; 
    createdAt: string; 
    user: { id: string; name: string; email: string }; 
    payment: AdminPayment[];
    items: AdminOrderItem[] 
};

export type AdminOrderList = { 
    orders: AdminOrder[]; 
    pagination: AdminPagination 
};

export type AdminCustomer = { 
    id: string; 
    name: string; 
    email: string; 
    role: "CUSTOMER"; 
    createdAt: string; 
    updatedAt: string 
};

export type AdminCustomerDetail = AdminCustomer & { 
    addresses: { id: string; addressLine1: string; city: string; district: string; postalCode: string; country: string }[]; 
    orders: { id: string; status: OrderStatus; total: string; createdAt: string }[] 
};

export type AdminCustomerList = { 
    customers: AdminCustomer[]; 
    pagination: AdminPagination 
};