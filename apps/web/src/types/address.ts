export type Address = {
    id: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    district: string;
    postalCode: string;
    country: string;
    createdAt: string;
    updatedAt: string;
  };
  
  export type CreateAddressData = {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    district: string;
    postalCode: string;
    country: string;
  };