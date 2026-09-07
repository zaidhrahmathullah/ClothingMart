export type ProductCategory = {
    id: string;
    name: string;
    slug: string;
  };
  
  export type ProductImage = {
    id: string;
    imageUrl: string;
    altText: string | null;
    sortOrder: number;
  };
  
  export type ProductVariant = {
    id: string;
    sku: string;
    size: string;
    color: string;
    price: string;
    stockQuantity: number;
    inStock: boolean;
  };
  
  export type Product = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isNew: boolean;
    createdAt: string;
  
    category: ProductCategory;
  
    images: ProductImage[];
  
    variants: ProductVariant[];
  
    startingPrice: string;
  
    inStock: boolean;
  };
  
  export type ProductPagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  
  export type ProductListResponse = {
    products: Product[];
    pagination: ProductPagination;
  };