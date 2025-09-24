import prisma from '../utils/prisma';

export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, createdAt: true } });
  return user;
}
