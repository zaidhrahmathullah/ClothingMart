"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  Search,
  UserRound,
  Users,
} from "lucide-react";

import { adminApi } from "@/features/admin/admin-api";
import type {
  AdminCustomerList,
} from "@/features/admin/admin-types";
import {
  AdminButton,
  AdminMetricCard,
  AdminPage,
  AdminState,
  formatDate,
  inputClass,
} from "@/features/admin/components/AdminPrimitives";

export default function AdminCustomersPage() {
  const [data, setData] =
    useState<AdminCustomerList | null>(
      null,
    );

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  async function load() {
    setLoading(true);
    setError("");

    try {
      setData(
        await adminApi.customers({
          search,
          limit: 50,
        }),
      );
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to load customers",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    adminApi
      .customers({
        search: "",
        limit: 50,
      })
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((value: unknown) => {
        if (!cancelled) {
          setError(
            value instanceof Error
              ? value.message
              : "Unable to load customers",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminPage
      eyebrow="Customers"
      title="Customer accounts"
      description="Browse registered customers and open their saved addresses and order history."
    >
      <div className="space-y-5">
        {/* Summary */}
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminMetricCard
            label="Loaded customers"
            value={
              data?.customers.length ??
              0
            }
            icon={UserRound}
          />

          <AdminMetricCard
            label="Matching customers"
            value={
              data?.pagination.total ??
              0
            }
            icon={Users}
          />
        </div>

        {/* Directory */}
        <section className="overflow-hidden rounded border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Directory
                </p>

                <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-neutral-950">
                  Registered customers
                </h2>

                <p className="mt-1 text-[10px] leading-4 text-neutral-500">
                  Find a customer by
                  name or email and open
                  their account history.
                </p>
              </div>

              {data && (
                <p className="text-[10px] text-neutral-400">
                  {
                    data.customers
                      .length
                  }{" "}
                  {data.customers
                    .length === 1
                    ? "customer"
                    : "customers"}{" "}
                  loaded
                </p>
              )}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void load();
              }}
              className="mt-4 flex max-w-xl flex-col gap-2 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search by name or email"
                  className={`${inputClass} pl-9`}
                />
              </div>

              <AdminButton
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Searching..."
                  : "Search"}
              </AdminButton>
            </form>
          </div>

          {error && (
            <div className="p-4 sm:p-5">
              <AdminState error>
                {error}
              </AdminState>
            </div>
          )}

          {!error &&
          loading &&
          !data ? (
            <div className="p-4 sm:p-5">
              <AdminState>
                Loading customers...
              </AdminState>
            </div>
          ) : !error &&
            data &&
            data.customers.length ===
              0 ? (
            <div className="p-4 sm:p-5">
              <AdminState>
                {search.trim()
                  ? "No customers match your search."
                  : "No customers are available yet."}
              </AdminState>
            </div>
          ) : (
            data && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead className="border-b border-neutral-200 bg-neutral-50/80">
                      <tr className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                        <th className="px-5 py-3">
                          Customer
                        </th>

                        <th className="px-4 py-3">
                          Account
                        </th>

                        <th className="px-4 py-3">
                          Joined
                        </th>

                        <th className="px-4 py-3">
                          Updated
                        </th>

                        <th className="px-5 py-3 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-neutral-100">
                      {data.customers.map(
                        (customer) => (
                          <tr
                            key={
                              customer.id
                            }
                            className="transition-colors hover:bg-neutral-50/70"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-600">
                                  <UserRound className="h-3.5 w-3.5" />
                                </div>

                                <div className="min-w-0">
                                  <p className="max-w-[200px] truncate text-[11px] font-semibold text-neutral-950">
                                    {
                                      customer.name
                                    }
                                  </p>

                                  <p className="mt-0.5 max-w-[220px] truncate text-[10px] text-neutral-500">
                                    {
                                      customer.email
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3.5">
                              <span className="inline-flex rounded bg-neutral-100 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-neutral-600">
                                {
                                  customer.role
                                }
                              </span>
                            </td>

                            <td className="px-4 py-3.5 text-[10px] text-neutral-500">
                              {formatDate(
                                customer.createdAt,
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-[10px] text-neutral-500">
                              {formatDate(
                                customer.updatedAt,
                              )}
                            </td>

                            <td className="px-5 py-3.5 text-right">
                              <Link
                                href={`/admin/customers/${customer.id}`}
                                className="inline-flex min-h-8 items-center rounded border border-neutral-200 bg-white px-2.5 text-[10px] font-semibold text-neutral-800 transition-colors hover:border-neutral-950 hover:text-neutral-950"
                              >
                                View profile
                              </Link>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                {data.pagination
                  .total >
                  data.customers
                    .length && (
                  <div className="border-t border-neutral-200 px-5 py-3">
                    <p className="text-[10px] text-neutral-500">
                      Showing{" "}
                      {
                        data.customers
                          .length
                      }{" "}
                      of{" "}
                      {
                        data
                          .pagination
                          .total
                      }{" "}
                      matching customers.
                    </p>
                  </div>
                )}
              </>
            )
          )}
        </section>
      </div>
    </AdminPage>
  );
}