"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_session_1 = __importDefault(require("express-session"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const proxy_1 = __importDefault(require("./routes/proxy"));
const catalog_1 = __importDefault(require("./routes/catalog"));
const clients_1 = __importDefault(require("./routes/clients"));
const stores_1 = __importDefault(require("./routes/stores"));
const accounts_1 = __importDefault(require("./routes/accounts"));
const suppliers_1 = __importDefault(require("./routes/suppliers"));
const registers_1 = __importDefault(require("./routes/registers"));
const sources_1 = __importDefault(require("./routes/sources"));
const documents_1 = __importDefault(require("./routes/documents"));
const shifts_1 = __importDefault(require("./routes/shifts"));
const search_1 = __importDefault(require("./routes/search"));
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
exports.io = io;
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Session configuration (using memory store for demo, PgSession for production)
// Note: Memory store is not production-ready but works for demo
app.use((0, express_session_1.default)({
    name: 'connect.sid',
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year (matching Ainur)
        sameSite: 'lax',
    },
}));
// Make io available in routes
app.set('io', io);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes (matching Ainur's structure)
app.use('/auth', auth_1.default);
app.use('/proxy', proxy_1.default); // Main proxy endpoint like Ainur
// Direct data routes
app.use('/data', catalog_1.default);
app.use('/data', clients_1.default);
app.use('/data', stores_1.default);
app.use('/data', accounts_1.default);
app.use('/data', suppliers_1.default);
app.use('/data', registers_1.default);
app.use('/data', sources_1.default);
// Document and search routes
app.use('/docs', documents_1.default);
app.use('/search', search_1.default);
app.use('/shift', shifts_1.default);
// Count endpoints
app.use('/count', catalog_1.default);
app.use('/count', clients_1.default);
// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('AUTH', async (data) => {
        // Handle authentication via socket
        try {
            // Authentication logic here
            socket.emit('AUTH_FETCH_SUCCEEDED', { success: true });
        }
        catch (error) {
            socket.emit('AUTH_FETCH_FAILED', { error: 'Authentication failed' });
        }
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: false,
        error: err.message || 'Internal server error',
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: false,
        error: 404,
        details: 'Route not found',
    });
});
// Start server
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
//# sourceMappingURL=index.js.map