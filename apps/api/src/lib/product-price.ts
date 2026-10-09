type PriceValue = {
  toString(): string;
};

type PriceVariant = {
  price: PriceValue | string | number;
  discountedPrice?: PriceValue | string | number | null;
};

export function getEffectivePrice(
  variant: PriceVariant,
): number {
  return Number(
    variant.discountedPrice ?? variant.price,
  );
}

export function getEffectivePriceString(
  variant: PriceVariant,
): string {
  return getEffectivePrice(variant).toFixed(2);
}

export function hasDiscount(
  variant: PriceVariant,
): boolean {
  if (variant.discountedPrice == null) {
    return false;
  }

  return (
    Number(variant.discountedPrice) <
    Number(variant.price)
  );
}