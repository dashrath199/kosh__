import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function summary(_req: Request, res: Response) {
  const users = await prisma.user.count();
  return res.json({ users });
}
