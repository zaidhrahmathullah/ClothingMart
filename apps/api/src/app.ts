import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import productRoutes from "./modules/products/products.routes.js";
import categoryRoutes from "./modules/categories/category.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import addressRoutes from "./modules/addresses/address.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import wishlistRoutes from "./modules/wishlist/wishlist.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";

import { uploadDirectory } from "./modules/admin/admin-upload.js";

import { errorHandler } from "./middleware/error-handler.js";


const app = express();

const isProduction =
  process.env.NODE_ENV === "production";

const webOrigin =
  process.env.WEB_ORIGIN;


if (isProduction && !webOrigin) {
  throw new Error(
    "WEB_ORIGIN must be defined in production",
  );
}


/**
 * Basic security configuration.
 */
app.disable("x-powered-by");

app.use((_req, res, next) => {
  res.setHeader(
    "X-Content-Type-Options",
    "nosniff",
  );

  res.setHeader(
    "X-Frame-Options",
    "DENY",
  );

  res.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin",
  );

  next();
});


/**
 * Request body parsing.
 *
 * PayPal webhook verification currently uses PayPal's
 * verify-webhook-signature API, which accepts the parsed
 * webhook event. Therefore the webhook does not require
 * a separate express.raw() body parser.
 */
app.use(
  express.json({
    limit: "1mb",

    verify(req, _res, buf) {
      const request = req as express.Request & { rawBody?: Buffer };

      if (request.originalUrl === "/api/v1/payments/webhooks/paypal") {
        request.rawBody = Buffer.from(buf);
      }
    },
  }),
);


/**
 * CORS configuration.
 *
 * PayPal webhook requests are server-to-server requests
 * and are not governed by browser CORS enforcement.
 */
app.use(
  cors({
    origin(origin, callback) {
      const allowedOrigin =
        webOrigin ??
        "http://localhost:3000";

      if (
        !origin ||
        origin === allowedOrigin
      ) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          "CORS origin not allowed",
        ),
      );
    },

    credentials: true,
  }),
);


/**
 * Cookie parsing.
 */
app.use(cookieParser());


/**
 * Static files.
 */
app.use(
  "/uploads/products",
  express.static(uploadDirectory),
);


/**
 * Health check.
 */
app.get(
  "/api/v1/health",
  (_req, res) => {
    res.json({
      success: true,
      data: {
        status: "ok",
      },
    });
  },
);


/**
 * API routes.
 */
app.use(
  "/api/v1/auth",
  authRoutes,
);

app.use(
  "/api/v1/products",
  productRoutes,
);

app.use(
  "/api/v1/categories",
  categoryRoutes,
);

app.use(
  "/api/v1/cart",
  cartRoutes,
);

app.use(
  "/api/v1/addresses",
  addressRoutes,
);

app.use(
  "/api/v1/orders",
  orderRoutes,
);

app.use(
  "/api/v1/wishlist",
  wishlistRoutes,
);

app.use(
  "/api/v1/admin",
  adminRoutes,
);

app.use(
  "/api/v1/payments",
  paymentRoutes,
);



app.use(errorHandler);


export default app;