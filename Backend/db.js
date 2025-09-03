import { createPool } from "mysql2/promise";
import dotenv from "dotenv";
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_USER,
  DB_PORT
} from './config.js'

dotenv.config();

export const pool = createPool({
  user: DB_USER,
  password: DB_PASSWORD,
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME
})

export default pool;

