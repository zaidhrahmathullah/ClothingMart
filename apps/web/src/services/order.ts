import { apiFetch } from "@/lib/api";

import type { Order } from "@/types/order";

export async function createOrder(
  addressId: string,
) {
  return apiFetch<Order>(
    "/orders",
    {
      method: "POST",
      body: JSON.stringify({
        addressId,
      }),
    },
  );
}

export async function getOrders() {
  return apiFetch<Order[]>(
    "/orders",
  );
}

export async function getOrder(
  orderId: string,
) {
  return apiFetch<Order>(
    `/orders/${orderId}`,
  );
}