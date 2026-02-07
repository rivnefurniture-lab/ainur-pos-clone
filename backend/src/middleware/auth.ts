import { Request, Response, NextFunction } from 'express';

export const DEFAULT_COMPANY_ID = '58c872aa3ce7d5fc688b49bd';
export const DEFAULT_USER_ID = '58c872aa3ce7d5fc688b49bc';

// No auth - just pass through
export const isAuthenticated = (_req: Request, _res: Response, next: NextFunction) => next();

export const getCompanyId = (req: Request): string => {
  return (typeof req.params.companyId === 'string' ? req.params.companyId : null) || DEFAULT_COMPANY_ID;
};

export const getUserId = (): string => DEFAULT_USER_ID;
