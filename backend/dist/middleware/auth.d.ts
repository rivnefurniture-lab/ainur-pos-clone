import { Request, Response, NextFunction } from 'express';
declare module 'express-session' {
    interface SessionData {
        userId: string;
        companyId: string;
        email: string;
        isAuthenticated: boolean;
    }
}
export declare const isAuthenticated: (req: Request, res: Response, next: NextFunction) => void;
export declare const getCompanyId: (req: Request) => string | null;
export declare const getUserId: (req: Request) => string | null;
//# sourceMappingURL=auth.d.ts.map