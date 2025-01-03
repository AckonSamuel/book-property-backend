import mysql from 'mysql2/promise';
import env from '../utils/env';

const pool = mysql.createPool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: Number(env.DB_PORT), // Convert port to number
});

export default pool;
