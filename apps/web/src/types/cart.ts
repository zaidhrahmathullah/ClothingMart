export type CartVariant = {
    id: string;
    sku: string;
    size: string;
    color: string;
    price: string;
    stockQuantity: number;
    inStock: boolean;
  };
  
  export type CartProduct = {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
  };
  
  export type CartItem = {
    id: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
    variant: CartVariant;
    product: CartProduct;
  };
  
  export type Cart = {
    id: string;
    items: CartItem[];
    itemCount: number;
    subtotal: string;
  };