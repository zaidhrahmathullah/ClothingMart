import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "../../middleware/auth.js";

import {
  createAddress,
  deleteAddress,
  getUserAddresses,
} from "./address.service.js";

export async function getAddressesController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const addresses = await getUserAddresses(
    req.user!.sub,
  );

  res.status(200).json({
    success: true,
    data: addresses,
  });
}

export async function createAddressController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const address = await createAddress(
    req.user!.sub,
    req.body,
  );

  res.status(201).json({
    success: true,
    data: address,
  });
}

export async function deleteAddressController(
  req: AuthenticatedRequest & Request<{ addressId: string }>,
  res: Response,
) {
  await deleteAddress(
    req.user!.sub,
    req.params.addressId,
  );

  res.status(200).json({
    success: true,
    data: null,
  });
}