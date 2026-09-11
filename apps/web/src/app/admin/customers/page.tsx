"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/features/admin/admin-api";
import type { AdminCustomerList } from "@/features/admin/admin-types";
import {
  AdminButton,
  AdminPage,
  AdminState,
  formatDate,
  inputClass,
} from "@/features/admin/components/AdminPrimitives";

export default function AdminCustomersPage() {
  const [data, setData] = useState<AdminCustomerList | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  function load() {
    adminApi
      .customers({ search, limit: 50 })
      .then(setData)
      .catch((value: unknown) =>
        setError(
          value instanceof Error ? value.message : "Unable to load customers",
        ),
      );
  }
  useEffect(() => {
    load();
  }, []);
  return (
    <AdminPage
      title="Customers"
      description="View customer accounts and order history."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          load();
        }}
        className="mb-4 flex max-w-xl gap-2"
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email"
          className={inputClass}
        />
        <AdminButton type="submit">Search</AdminButton>
      </form>
      {error && <AdminState error>{error}</AdminState>}
      {!data && !error ? (
        <AdminState>Loading customers...</AdminState>
      ) : data && data.customers.length === 0 ? (
        <AdminState>No customers found.</AdminState>
      ) : (
        data && (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="font-semibold text-neutral-950 hover:underline"
                      >
                        {customer.name}
                      </Link>
                      <p className="text-xs text-neutral-500">
                        {customer.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {formatDate(customer.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </AdminPage>
  );
}
