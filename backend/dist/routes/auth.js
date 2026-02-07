"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const router = (0, express_1.Router)();
/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        if (!login || !password) {
            return res.status(400).json({
                status: false,
                error: 'Email and password are required',
            });
        }
        // Find user by email
        const result = await database_1.default.query('SELECT * FROM users WHERE email = $1 AND deleted = false', [login.toLowerCase()]);
        let user = result.rows[0];
        // If user not found, check if it's the Ainur admin credentials
        if (!user) {
            // Check for the original Ainur admin user
            if (login.toLowerCase() === 'o_kytsuk@mail.ru' && password === 'olegister14041992') {
                // Create/update the admin user session
                req.session.userId = '58c872aa3ce7d5fc688b49bc';
                req.session.companyId = '58c872aa3ce7d5fc688b49bd';
                req.session.userEmail = 'o_kytsuk@mail.ru';
                req.session.userName = 'Олег Кицюк';
                return res.json({
                    status: true,
                    data: {
                        user: {
                            _id: '58c872aa3ce7d5fc688b49bc',
                            name: 'Олег Кицюк',
                            email: 'o_kytsuk@mail.ru',
                            role: 'admin',
                        },
                        client: {
                            _id: '58c872aa3ce7d5fc688b49bd',
                            name: 'Loveiska Toys',
                        },
                    },
                });
            }
            return res.status(401).json({
                status: false,
                error: 'Invalid credentials',
            });
        }
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                status: false,
                error: 'Invalid credentials',
            });
        }
        // Set session
        req.session.userId = user._id;
        req.session.companyId = user._client;
        req.session.userEmail = user.email;
        req.session.userName = user.name;
        res.json({
            status: true,
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                client: {
                    _id: user._client,
                    name: 'Loveiska Toys',
                },
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: false,
            error: 'Login failed',
        });
    }
});
/**
 * POST /api/auth/logout
 * Logout current user
 */
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                status: false,
                error: 'Logout failed',
            });
        }
        res.clearCookie('connect.sid');
        res.json({
            status: true,
            message: 'Logged out successfully',
        });
    });
});
/**
 * GET /api/auth/status
 * Check authentication status
 */
router.get('/status', async (req, res) => {
    if (req.session.userId) {
        try {
            const result = await database_1.default.query('SELECT _id, name, email, role FROM users WHERE _id = $1', [req.session.userId]);
            const user = result.rows[0];
            // If user not found in DB, still return session data (for imported data)
            res.json({
                status: true,
                data: {
                    isAuthenticated: true,
                    user: user ? {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    } : {
                        _id: req.session.userId,
                        name: req.session.userName,
                        email: req.session.userEmail,
                        role: 'admin',
                    },
                    client: {
                        _id: req.session.companyId,
                        name: 'Loveiska Toys',
                    },
                },
            });
        }
        catch (error) {
            console.error('Status check error:', error);
            res.json({
                status: true,
                data: {
                    isAuthenticated: true,
                    user: {
                        _id: req.session.userId,
                        name: req.session.userName,
                        email: req.session.userEmail,
                        role: 'admin',
                    },
                    client: {
                        _id: req.session.companyId,
                        name: 'Loveiska Toys',
                    },
                },
            });
        }
    }
    else {
        res.json({
            status: true,
            data: {
                isAuthenticated: false,
                user: null,
                client: null,
            },
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map