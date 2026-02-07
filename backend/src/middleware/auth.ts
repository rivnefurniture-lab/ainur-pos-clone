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
  
  // Allow access for default company (development/demo mode)
  // Check in params, body, or query
  const companyId = req.params.companyId || req.body?.companyId || req.query.companyId as string;
  
  // Also check URL path for company ID pattern
  const urlMatch = req.path.match(/\/([a-f0-9]{24})\//);
  const urlCompanyId = urlMatch ? urlMatch[1] : null;
  
  if (companyId === DEFAULT_COMPANY_ID || urlCompanyId === DEFAULT_COMPANY_ID) {
    // Allow access without session for default company
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
  return req.session?.companyId || req.params.companyId || DEFAULT_COMPANY_ID;
};

export const getUserId = (req: Request): string | null => {
  return req.session?.userId || DEFAULT_USER_ID;
};
