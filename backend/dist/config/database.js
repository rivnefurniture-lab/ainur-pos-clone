"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ainur_pos',
    user: process.env.DB_USER || process.env.USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
};
// Use DATABASE_URL if provided (for production)
if (process.env.DATABASE_URL) {
    poolConfig.connectionString = process.env.DATABASE_URL;
    poolConfig.ssl = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
}
exports.pool = new pg_1.Pool(poolConfig);
// Test connection
exports.pool.on('connect', () => {
    console.log('Database connected successfully');
});
exports.pool.on('error', (err) => {
    console.error('Database connection error:', err.message);
});
// Initial connection test
exports.pool.connect()
    .then(client => {
    console.log('Database connection established');
    client.release();
})
    .catch(err => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
});
exports.default = exports.pool;
//# sourceMappingURL=database.js.map