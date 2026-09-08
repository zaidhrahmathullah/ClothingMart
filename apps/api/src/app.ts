import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import productRoutes from "./modules/products/products.routes.js";
import categoryRoutes from "./modules/categories/category.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import addressRoutes from "./modules/addresses/address.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";

import { errorHandler } from "./middleware/error-handler.js";

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);

app.get("/api/v1/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
    },
  });
});

app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/orders", orderRoutes);

app.use(errorHandler);

export default app;