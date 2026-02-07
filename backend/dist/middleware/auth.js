"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserId = exports.getCompanyId = exports.isAuthenticated = void 0;
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }
    res.status(401).json({
        status: false,
        error: 'Unauthorized',
        details: 'Please login to access this resource',
    });
};
exports.isAuthenticated = isAuthenticated;
const getCompanyId = (req) => {
    return req.session?.companyId || null;
};
exports.getCompanyId = getCompanyId;
const getUserId = (req) => {
    return req.session?.userId || null;
};
exports.getUserId = getUserId;
//# sourceMappingURL=auth.js.map