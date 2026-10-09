import { AppError } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";

export type CreateAddressData = {
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
};

export type UpdateAddressData =
  Partial<CreateAddressData>;

async function findOwnedAddress(
  userId: string,
  addressId: string,
) {
  const address =
    await prisma.address.findFirst({
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

  return address;
}

export async function getUserAddresses(
  userId: string,
) {
  let addresses =
    await prisma.address.findMany({
      where: {
        userId,
      },
      orderBy: [
        {
          isDefault: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

  /*
   * Backward compatibility for addresses
   * created before isDefault existed.
   *
   * If the user has saved addresses but none
   * is marked as default, promote the newest
   * one exactly once.
   */
  if (
    addresses.length > 0 &&
    !addresses.some(
      (address) => address.isDefault,
    )
  ) {
    const addressToPromote =
      addresses[0];

    await prisma.address.update({
      where: {
        id: addressToPromote.id,
      },
      data: {
        isDefault: true,
      },
    });

    addresses = addresses.map(
      (address) => ({
        ...address,
        isDefault:
          address.id ===
          addressToPromote.id,
      }),
    );
  }

  return addresses;
}

export async function createAddress(
  userId: string,
  data: CreateAddressData,
) {
  return prisma.$transaction(
    async (tx) => {
      const existingAddressCount =
        await tx.address.count({
          where: {
            userId,
          },
        });

      /*
       * The customer's first address
       * automatically becomes the default.
       */
      const shouldBeDefault =
        existingAddressCount === 0 ||
        data.isDefault === true;

      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: {
            userId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.address.create({
        data: {
          userId,
          label: data.label,
          isDefault: shouldBeDefault,
          fullName: data.fullName,
          phone: data.phone,
          addressLine1:
            data.addressLine1,
          addressLine2:
            data.addressLine2 || null,
          city: data.city,
          district: data.district,
          postalCode: data.postalCode,
          country: data.country,
        },
      });
    },
  );
}

export async function updateAddress(
  userId: string,
  addressId: string,
  data: UpdateAddressData,
) {
  const currentAddress =
    await findOwnedAddress(
      userId,
      addressId,
    );

  return prisma.$transaction(
    async (tx) => {
      if (data.isDefault === true) {
        await tx.address.updateMany({
          where: {
            userId,
            isDefault: true,
            NOT: {
              id: addressId,
            },
          },
          data: {
            isDefault: false,
          },
        });
      }

      const address =
        await tx.address.update({
          where: {
            id: currentAddress.id,
          },
          data: {
            ...(data.label !== undefined && {
              label: data.label,
            }),

            ...(data.fullName !==
              undefined && {
              fullName: data.fullName,
            }),

            ...(data.phone !== undefined && {
              phone: data.phone,
            }),

            ...(data.addressLine1 !==
              undefined && {
              addressLine1:
                data.addressLine1,
            }),

            ...(data.addressLine2 !==
              undefined && {
              addressLine2:
                data.addressLine2 ||
                null,
            }),

            ...(data.city !== undefined && {
              city: data.city,
            }),

            ...(data.district !==
              undefined && {
              district: data.district,
            }),

            ...(data.postalCode !==
              undefined && {
              postalCode:
                data.postalCode,
            }),

            ...(data.country !==
              undefined && {
              country: data.country,
            }),

            /*
             * We allow promoting an address
             * to default here.
             *
             * We intentionally don't allow
             * directly removing default status,
             * because that could leave the user
             * with addresses but no default.
             */
            ...(data.isDefault === true && {
              isDefault: true,
            }),
          },
        });

      return address;
    },
  );
}

export async function setDefaultAddress(
  userId: string,
  addressId: string,
) {
  const address =
    await findOwnedAddress(
      userId,
      addressId,
    );

  return prisma.$transaction(
    async (tx) => {
      await tx.address.updateMany({
        where: {
          userId,
          isDefault: true,
          NOT: {
            id: address.id,
          },
        },
        data: {
          isDefault: false,
        },
      });

      return tx.address.update({
        where: {
          id: address.id,
        },
        data: {
          isDefault: true,
        },
      });
    },
  );
}

export async function deleteAddress(
  userId: string,
  addressId: string,
) {
  const address =
    await findOwnedAddress(
      userId,
      addressId,
    );

  /*
   * Orders already reference Address.
   * We therefore preserve the existing
   * database behaviour and let Prisma /
   * PostgreSQL protect referenced records.
   *
   * We only need to handle default reassignment
   * when deletion succeeds.
   */
  await prisma.$transaction(
    async (tx) => {
      await tx.address.delete({
        where: {
          id: address.id,
        },
      });

      if (!address.isDefault) {
        return;
      }

      const replacement =
        await tx.address.findFirst({
          where: {
            userId,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

      if (replacement) {
        await tx.address.update({
          where: {
            id: replacement.id,
          },
          data: {
            isDefault: true,
          },
        });
      }
    },
  );
}