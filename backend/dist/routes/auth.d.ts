declare const router: import("express-serve-static-core").Router;
declare module 'express-session' {
    interface SessionData {
        userId: string;
        companyId: string;
        userEmail: string;
        userName: string;
    }
}
export default router;
//# sourceMappingURL=auth.d.ts.map