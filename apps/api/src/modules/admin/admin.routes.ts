import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { UserRole } from "../../generated/prisma/enums.js";
import { AppError } from "../../lib/app-error.js";
import * as controller from "./admin.controller.js";
import { uploadProductImagesController } from "./admin-upload.controller.js";
import { productImageUpload } from "./admin-upload.js";

const router = Router();
router.use(authenticate, requireRole(UserRole.ADMIN));

const uploadProductImages = productImageUpload.array("images", 6);

function handleProductImageUpload(req: Parameters<typeof uploadProductImages>[0], res: Parameters<typeof uploadProductImages>[1], next: Parameters<typeof uploadProductImages>[2]) {
	uploadProductImages(req, res, (error) => {
		if (error) {
			next(new AppError(400, "INVALID_PRODUCT_IMAGES", "Images must be JPG, PNG, WebP, or GIF files no larger than 3 MB each."));
			return;
		}
		next();
	});
}

router.get("/dashboard", controller.getDashboard);
router.post(
	"/uploads/product-images",
	handleProductImageUpload,
	uploadProductImagesController,
);
router.get("/products", controller.listProducts);
router.post("/products", controller.createProduct);
router.get("/products/:productId", controller.getProduct);
router.patch("/products/:productId", controller.updateProduct);
router.post("/products/:productId/deactivate", controller.deactivateProduct);
router.post("/products/:productId/activate", controller.activateProduct);
router.get("/categories", controller.listCategories);
router.post("/categories", controller.createCategory);
router.get("/categories/:categoryId", controller.getCategory);
router.patch("/categories/:categoryId", controller.updateCategory);
router.patch("/categories/:categoryId/status", controller.updateCategoryStatus);
router.delete("/categories/:categoryId", controller.deactivateCategory);
router.get("/inventory", controller.listInventory);
router.patch("/inventory/:variantId", controller.updateInventory);
router.get("/orders", controller.listOrders);
router.get("/orders/:orderId", controller.getOrder);
router.patch("/orders/:orderId/status", controller.updateOrderStatus);
router.get("/customers", controller.listCustomers);
router.get("/customers/:customerId", controller.getCustomer);

export default router;
