import { Request, Response, NextFunction } from 'express';

// Default company for development
const DEFAULT_COMPANY_ID = '58c872aa3ce7d5fc688b49bd';
const DEFAULT_USER_ID = '58c872aa3ce7d5fc688b49bc';

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

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // Check if authenticated via session
  if (req.session && req.session.isAuthenticated) {
    return next();
  }
  
  // Allow access for default company (development mode)
  const companyId = req.params.companyId || req.query.companyId;
  if (companyId === DEFAULT_COMPANY_ID) {
    // Auto-set session for default company
    req.session.userId = DEFAULT_USER_ID;
    req.session.companyId = DEFAULT_COMPANY_ID;
    req.session.isAuthenticated = true;
    return next();
  }
  
  res.status(401).json({
    status: false,
    error: 'Unauthorized',
    details: 'Please login to access this resource',
  });
};

export const getCompanyId = (req: Request): string | null => {
  // Return session company or default
  return req.session?.companyId || DEFAULT_COMPANY_ID;
};

export const getUserId = (req: Request): string | null => {
  return req.session?.userId || DEFAULT_USER_ID;
};
