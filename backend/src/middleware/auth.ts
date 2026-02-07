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

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // Check if authenticated via session
  if (req.session && req.session.isAuthenticated) {
    return next();
  }
  
  // DEMO MODE: Allow access if the URL contains the default company ID anywhere
  // This is a permissive check for development/demo purposes
  if (req.originalUrl.includes(DEFAULT_COMPANY_ID)) {
    return next();
  }
  
  // Also check params
  if (req.params.companyId === DEFAULT_COMPANY_ID) {
    return next();
  }
  
  // Check body for companyId
  if (req.body?.companyId === DEFAULT_COMPANY_ID) {
    return next();
  }
  
  // Check query params
  if (req.query.companyId === DEFAULT_COMPANY_ID) {
    return next();
  }
  
  res.status(401).json({
    status: false,
    error: 'Unauthorized',
    details: 'Please login to access this resource',
  });
};

export const getCompanyId = (req: Request): string => {
  // Return session company or default - always return a valid company ID
  const paramCompanyId = typeof req.params.companyId === 'string' ? req.params.companyId : undefined;
  return req.session?.companyId || paramCompanyId || DEFAULT_COMPANY_ID;
};

export const getUserId = (req: Request): string | null => {
  return req.session?.userId || DEFAULT_USER_ID;
};
