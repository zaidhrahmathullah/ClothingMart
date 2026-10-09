import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomUUID } from "node:crypto";

import { prisma } from "../../lib/prisma.js";

import {
  createCategory,
  updateCategory,
} from "../admin/admin.service.js";

import {
  getCategories,
  getCategoryProducts,
} from "./category.service.js";

// A unique prefix prevents collisions with real category names.
const testPrefix = `category-test-${randomUUID()}`;

// Track only records created by this test suite.
const createdCategoryIds: string[] = [];


const createdProductIds: string[] = [];

async function createTestProduct(
  name: string,
  categoryId: string,
) {
  const product = await prisma.product.create({
    data: {
      name,
      slug: `${testPrefix}-${name.toLowerCase()}`,
      categoryId,
      isActive: true,
    },
  });

  createdProductIds.push(product.id);

  return product;
}

async function createTestCategory(
  name: string,
  parentId?: string | null,
) {
  const category = await createCategory({
    name,
    slug: `${testPrefix}-${name.toLowerCase()}`,
    ...(parentId !== undefined ? { parentId } : {}),
  });

  createdCategoryIds.push(category.id);

  return category;
}

// Cleanup children before parents.
// Never delete unrelated categories or truncate database tables.
after(async () => {
  try {
    // Products must be removed before their categories.
    for (const id of [...createdProductIds].reverse()) {
      await prisma.product.deleteMany({
        where: { id },
      });
    }

    // Delete subcategories before parent categories.
    for (const id of [...createdCategoryIds].reverse()) {
      await prisma.category.deleteMany({
        where: { id },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
});

test("Category hierarchy", async (t) => {
  let parentId: string;
  let childId: string;

  await t.test("creates a main category", async () => {
    const parent = await createTestCategory("Parent");

    parentId = parent.id;

    assert.equal(parent.parentId, null);
    assert.equal(parent.name, "Parent");
  });

  await t.test("creates a valid subcategory", async () => {
    const child = await createTestCategory(
      "Child",
      parentId,
    );

    childId = child.id;

    assert.equal(child.parentId, parentId);
  });

  await t.test("rejects a nonexistent parent", async () => {
    await assert.rejects(
      () =>
        createCategory({
          name: "Invalid Parent",
          slug: `${testPrefix}-invalid-parent`,
          parentId: randomUUID(),
        }),
      (error: unknown) => {
        assert.equal(
          (error as { code?: string }).code,
          "PARENT_CATEGORY_NOT_FOUND",
        );

        return true;
      },
    );
  });

  await t.test("rejects three-level nesting", async () => {
    await assert.rejects(
      () =>
        createCategory({
          name: "Grandchild",
          slug: `${testPrefix}-grandchild`,
          parentId: childId,
        }),
      (error: unknown) => {
        assert.equal(
          (error as { code?: string }).code,
          "INVALID_CATEGORY_HIERARCHY",
        );

        return true;
      },
    );
  });

  await t.test("rejects self-parenting", async () => {
    await assert.rejects(
      () =>
        updateCategory(parentId, {
          parentId,
        }),
      (error: unknown) => {
        assert.equal(
          (error as { code?: string }).code,
          "CATEGORY_SELF_PARENT",
        );

        return true;
      },
    );
  });

  await t.test(
  "rejects moving a parent with children under another parent",
  async () => {
    const anotherParent = await createTestCategory("AnotherParent");

    await assert.rejects(
      () =>
        updateCategory(parentId, {
          parentId: anotherParent.id,
        }),
      (error: unknown) => {
        assert.equal(
          (error as { code?: string }).code,
          "INVALID_CATEGORY_HIERARCHY",
        );

        return true;
      },
    );
  },
);


test("Public category API", async (t) => {
  let parentId: string;
  let activeChildId: string;
  let inactiveChildId: string;

  let parentProductId: string;
  let childProductId: string;
  let inactiveChildProductId: string;

  await t.test(
    "creates isolated public API fixtures",
    async () => {
      const parent = await createTestCategory("PublicParent");
      const activeChild = await createTestCategory(
        "PublicActiveChild",
        parent.id,
      );

      const inactiveChild = await createTestCategory(
        "PublicInactiveChild",
        parent.id,
      );

      parentId = parent.id;
      activeChildId = activeChild.id;
      inactiveChildId = inactiveChild.id;

      await updateCategory(inactiveChildId, {
        isActive: false,
      });

      const parentProduct = await createTestProduct(
        "ParentProduct",
        parentId,
      );

      const childProduct = await createTestProduct(
        "ChildProduct",
        activeChildId,
      );

      const inactiveChildProduct = await createTestProduct(
        "InactiveChildProduct",
        inactiveChildId,
      );

      parentProductId = parentProduct.id;
      childProductId = childProduct.id;
      inactiveChildProductId = inactiveChildProduct.id;
    },
  );

  await t.test(
    "returns active parents and active children only",
    async () => {
      const categories = await getCategories();

      const parent = categories.find(
        (category) => category.id === parentId,
      );

      assert.ok(parent);

      assert.ok(
        parent.children.some(
          (child) => child.id === activeChildId,
        ),
      );

      assert.ok(
        !parent.children.some(
          (child) => child.id === inactiveChildId,
        ),
      );
    },
  );

  await t.test(
    "aggregates active subcategory products under the parent",
    async () => {
      const products = await getCategoryProducts(
        `${testPrefix}-publicparent`,
      );

      assert.ok(products);

      const productIds = products.map(
        (product) => product.id,
      );

      assert.ok(productIds.includes(parentProductId));
      assert.ok(productIds.includes(childProductId));

      assert.ok(
        !productIds.includes(inactiveChildProductId),
      );
    },
  );

  await t.test(
    "returns only directly assigned subcategory products",
    async () => {
      const products = await getCategoryProducts(
        `${testPrefix}-publicactivechild`,
      );

      assert.ok(products);

      assert.deepEqual(
        products.map((product) => product.id),
        [childProductId],
      );
    },
  );

  await t.test(
    "hides inactive subcategories",
    async () => {
      const products = await getCategoryProducts(
        `${testPrefix}-publicinactivechild`,
      );

      assert.equal(products, null);
    },
  );

  await t.test(
    "hides a subcategory when its parent is inactive",
    async () => {
      await updateCategory(activeChildId, {
        isActive: false,
      });

      await updateCategory(parentId, {
        isActive: false,
      });

      const products = await getCategoryProducts(
        `${testPrefix}-publicactivechild`,
      );

      assert.equal(products, null);
    },
  );
});


await t.test(
  "rejects deactivating a parent with active children",
  async () => {
    await assert.rejects(
      () =>
        updateCategory(parentId, {
          isActive: false,
        }),
      (error: unknown) => {
        assert.equal(
          (error as { code?: string }).code,
          "ACTIVE_SUBCATEGORIES_EXIST",
        );

        return true;
      },
    );
  },
);

await t.test(
  "rejects activating a child under an inactive parent",
  async () => {
    // Deactivate the child first, then its parent.
    await updateCategory(childId, {
      isActive: false,
    });

    await updateCategory(parentId, {
      isActive: false,
    });

    await assert.rejects(
      () =>
        updateCategory(childId, {
          isActive: true,
        }),
      (error: unknown) => {
        assert.equal(
          (error as { code?: string }).code,
          "INACTIVE_PARENT_CATEGORY",
        );

        return true;
      },
    );
  },
);
});