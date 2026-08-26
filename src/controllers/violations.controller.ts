import { Request, Response, NextFunction } from 'express';
import { ViolationsService } from '../services/violations.service.js';

export class ViolationsController {
  public static async getViolations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { groupId, userId, category, severity, startDate, endDate, limit, offset } = req.query;

      const result = await ViolationsService.getViolations({
        groupId: groupId as string,
        userId: userId as string,
        category: category as string,
        severity: severity as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  public static async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search } = req.query;
      const members = await ViolationsService.getMembers(search as string);
      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  }

  public static async resetMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await ViolationsService.resetMemberViolations(req.params.id);
      res.json({
        success: true,
        message: 'تم تصفير مخالفات العضو بنجاح',
        data: member,
      });
    } catch (error) {
      next(error);
    }
  }
}
