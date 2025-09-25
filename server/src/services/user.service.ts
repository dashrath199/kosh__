import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

const profileSelect = {
  id: true,
  email: true,
  name: true,
  phoneNumber: true,
  dateOfBirth: true,
  address: true,
  city: true,
  state: true,
  country: true,
  postalCode: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getProfile(userId: number) {
  return prisma.user.findUnique({ where: { id: userId }, select: profileSelect });
}

export async function updateProfile(userId: number, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where: { id: userId }, data, select: profileSelect });
}
