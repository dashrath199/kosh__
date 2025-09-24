import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as UserService from '../services/user.service';

export async function me(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await UserService.getProfile(req.userId);
    return res.json(user);
  } catch (e: any) {
    return res.status(500).json({ message: e.message || 'Failed to fetch profile' });
  }
}
