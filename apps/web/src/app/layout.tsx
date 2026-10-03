import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

import {
  CartProvider,
} from "@/features/cart/context/CartContext";

import {
  serverApiFetch,
} from "@/lib/server-api";

import type { Cart } from "@/types/cart";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClothingMart",
  description:
    "A modern full-stack fashion e-commerce platform.",
};

async function getInitialCart() {
  try {
    return await serverApiFetch<Cart>(
      "/cart",
    );
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const initialCart =
    await getInitialCart();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider
          initialCart={initialCart}
        >
          <Navbar />

          <main className="flex-1">
            {children}
          </main>

          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}