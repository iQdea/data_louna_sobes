import { generateSalt, hash } from "../../hasher/utils";
import { getConnection } from "../../../config/postgres.config";
import { Sql } from "postgres";

(async () => {
  try {
    const sql: Sql = getConnection();
    const users: [string, string, string, number][] = [
      ['8d5fbe17-391e-4132-bde5-646901d53a85', '1@ya.ru', 'test123!', 50.00],
    ]

    for (const x of users) {
      const [userId, email, password, balance] = x;
      const savedPassword = hash(password, generateSalt(10));
      await sql`INSERT INTO users (id, email, balance, password)
          VALUES (${userId}, ${email}, ${balance}, ${savedPassword})`
    }
    await sql.end()
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
})()
