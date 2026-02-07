import { Request, Response, NextFunction } from 'express';

// Default company for development
export const DEFAULT_COMPANY_ID = '58c872aa3ce7d5fc688b49bd';
export const DEFAULT_USER_ID = '58c872aa3ce7d5fc688b49bc';

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId: string;
    companyId: string;
    userEmail: string;
    userName: string;
    isAuthenticated: boolean;
  }
}

// NO AUTHENTICATION - Allow all requests
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  return next();
};

export const getCompanyId = (req: Request): string => {
  // Return session company or default - always return a valid company ID
  const paramCompanyId = typeof req.params.companyId === 'string' ? req.params.companyId : undefined;
  return req.session?.companyId || paramCompanyId || DEFAULT_COMPANY_ID;
};

export const getUserId = (req: Request): string | null => {
  return req.session?.userId || DEFAULT_USER_ID;
};
