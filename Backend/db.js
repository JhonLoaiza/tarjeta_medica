import { createPool } from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = createPool({
  user: 'root',
  password: 'chugi12',
  host: 'localhost',
  port: 3306,
  database: 'ficha_medica'
})

export default pool;

