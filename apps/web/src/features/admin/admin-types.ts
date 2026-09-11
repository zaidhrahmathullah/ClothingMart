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
    lowStock: number 
};

export type AdminCategory = { 
    id: string; 
    name: string; 
    slug: string; 
    description: string | null; 
    imageUrl: string | null; 
    isActive: boolean; 
    _count?: { products: number } 
};

export type AdminVariant = { 
    id?: string; 
    sku: string; 
    size: string; 
    color: string; 
    price: string; 
    quantity: number; 
    isActive: boolean 
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

export type AdminOrder = { 
    id: string; 
    status: OrderStatus; 
    total: string; 
    createdAt: string; 
    user: { id: string; name: string; email: string }; 
    payment?: { status: string; provider: string } | null; 
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