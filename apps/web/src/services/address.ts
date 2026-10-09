import { apiFetch } from "@/lib/api";

import type {
  Address,
  CreateAddressData,
  UpdateAddressData,
} from "@/types/address";

export async function getAddresses() {
  return apiFetch<Address[]>("/addresses");
}

export async function createAddress(
  data: CreateAddressData,
) {
  return apiFetch<Address>("/addresses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAddress(
  addressId: string,
  data: UpdateAddressData,
) {
  return apiFetch<Address>(
    `/addresses/${addressId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

export async function setDefaultAddress(
  addressId: string,
) {
  return apiFetch<Address>(
    `/addresses/${addressId}/default`,
    {
      method: "PATCH",
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