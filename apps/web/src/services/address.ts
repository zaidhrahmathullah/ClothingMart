import { apiFetch } from "@/lib/api";

import type {
  Address,
  CreateAddressData,
} from "@/types/address";

export async function getAddresses() {
  return apiFetch<Address[]>(
    "/addresses",
  );
}

export async function createAddress(
  data: CreateAddressData,
) {
  return apiFetch<Address>(
    "/addresses",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function deleteAddress(
  addressId: string,
) {
  return apiFetch<null>(
    `/addresses/${addressId}`,
    {
      method: "DELETE",
    },
  );
}