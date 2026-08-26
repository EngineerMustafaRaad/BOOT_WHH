import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب ألا تقل عن 6 أحرف'),
});

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      if (!result) {
        res.status(401).json({
          success: false,
          message: 'بيانات الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور.',
        });
        return;
      }

      res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'غير مصرح' });
        return;
      }

      const profile = await AuthService.getProfile(req.user.userId);
      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
    });
  }
}
