import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";

export type CreateAddressData = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
};

export async function getUserAddresses(userId: string) {
  return prisma.address.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createAddress(
  userId: string,
  data: CreateAddressData,
) {
  return prisma.address.create({
    data: {
      userId,
      fullName: data.fullName,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || null,
      city: data.city,
      district: data.district,
      postalCode: data.postalCode,
      country: data.country,
    },
  });
}

export async function deleteAddress(
  userId: string,
  addressId: string,
) {
  const address = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId,
    },
  });

  if (!address) {
    throw new AppError(
      404,
      "ADDRESS_NOT_FOUND",
      "Address not found",
    );
  }

  await prisma.address.delete({
    where: {
      id: address.id,
    },
  });
}