import "./config/env.js";

const { default: app } =
  await import("./app.js");

const {
  registerPaymentProviders,
} = await import(
  "./modules/payments/providers/provider.registry.js"
);

registerPaymentProviders();

const PORT = 4000;

app.listen(PORT, () => {
  console.log(
    `ClothingMart API running on http://localhost:${PORT}`,
  );
});