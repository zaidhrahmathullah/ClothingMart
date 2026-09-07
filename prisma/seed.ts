import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../apps/api/src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Seeding ClothingMart database...");

  await prisma.inventory.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const men = await prisma.category.create({
    data: {
      name: "Men",
      slug: "men",
      description: "Modern everyday clothing for men.",
      imageUrl: "/images/categories/men.jpg",
    },
  });

  const women = await prisma.category.create({
    data: {
      name: "Women",
      slug: "women",
      description: "Contemporary fashion for women.",
      imageUrl: "/images/categories/women.jpg",
    },
  });

  const kids = await prisma.category.create({
    data: {
      name: "Kids",
      slug: "kids",
      description: "Comfortable and stylish clothing for kids.",
      imageUrl: "/images/categories/kids.jpg",
    },
  });

  const tShirt = await prisma.product.create({
    data: {
      categoryId: men.id,
      name: "Classic Oversized T-Shirt",
      slug: "classic-oversized-t-shirt",
      description:
        "A relaxed-fit everyday t-shirt designed for comfort and effortless style.",
      isNew: true,
      images: {
        create: [
          {
            imageUrl: "/images/products/classic-oversized-tshirt-1.jpg",
            altText: "Classic oversized t-shirt front view",
            sortOrder: 0,
          },
          {
            imageUrl: "/images/products/classic-oversized-tshirt-2.jpg",
            altText: "Classic oversized t-shirt detail",
            sortOrder: 1,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: "COT-BLK-S",
            size: "S",
            color: "Black",
            price: 4500,
            inventory: {
              create: {
                quantity: 20,
              },
            },
          },
          {
            sku: "COT-BLK-M",
            size: "M",
            color: "Black",
            price: 4500,
            inventory: {
              create: {
                quantity: 25,
              },
            },
          },
          {
            sku: "COT-BLK-L",
            size: "L",
            color: "Black",
            price: 4500,
            inventory: {
              create: {
                quantity: 18,
              },
            },
          },
          {
            sku: "COT-WHT-M",
            size: "M",
            color: "White",
            price: 4500,
            inventory: {
              create: {
                quantity: 15,
              },
            },
          },
        ],
      },
    },
  });

  const hoodie = await prisma.product.create({
    data: {
      categoryId: men.id,
      name: "Essential Cotton Hoodie",
      slug: "essential-cotton-hoodie",
      description:
        "A versatile cotton hoodie designed for casual everyday wear.",
      isNew: true,
      images: {
        create: [
          {
            imageUrl: "/images/products/essential-hoodie-1.jpg",
            altText: "Essential cotton hoodie",
            sortOrder: 0,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: "ECH-GRY-M",
            size: "M",
            color: "Grey",
            price: 7500,
            inventory: {
              create: {
                quantity: 12,
              },
            },
          },
          {
            sku: "ECH-GRY-L",
            size: "L",
            color: "Grey",
            price: 7500,
            inventory: {
              create: {
                quantity: 8,
              },
            },
          },
        ],
      },
    },
  });

  const dress = await prisma.product.create({
    data: {
      categoryId: women.id,
      name: "Elegant Casual Dress",
      slug: "elegant-casual-dress",
      description:
        "A comfortable casual dress combining a clean silhouette with everyday versatility.",
      isNew: true,
      images: {
        create: [
          {
            imageUrl: "/images/products/elegant-casual-dress-1.jpg",
            altText: "Elegant casual dress",
            sortOrder: 0,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: "ECD-BLK-S",
            size: "S",
            color: "Black",
            price: 8500,
            inventory: {
              create: {
                quantity: 10,
              },
            },
          },
          {
            sku: "ECD-BLK-M",
            size: "M",
            color: "Black",
            price: 8500,
            inventory: {
              create: {
                quantity: 14,
              },
            },
          },
        ],
      },
    },
  });

  const kidsSet = await prisma.product.create({
    data: {
      categoryId: kids.id,
      name: "Kids Everyday Set",
      slug: "kids-everyday-set",
      description:
        "A comfortable everyday outfit designed for active kids.",
      images: {
        create: [
          {
            imageUrl: "/images/products/kids-everyday-set-1.jpg",
            altText: "Kids everyday clothing set",
            sortOrder: 0,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: "KES-BLU-8",
            size: "8Y",
            color: "Blue",
            price: 5500,
            inventory: {
              create: {
                quantity: 16,
              },
            },
          },
          {
            sku: "KES-BLU-10",
            size: "10Y",
            color: "Blue",
            price: 5500,
            inventory: {
              create: {
                quantity: 13,
              },
            },
          },
        ],
      },
    },
  });

  console.log("Created categories:", {
    men: men.id,
    women: women.id,
    kids: kids.id,
  });

  console.log("Created products:", {
    tShirt: tShirt.id,
    hoodie: hoodie.id,
    dress: dress.id,
    kidsSet: kidsSet.id,
  });

  console.log("✅ ClothingMart database seeded successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });