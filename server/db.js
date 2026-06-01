import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      share_token TEXT UNIQUE,
      is_public BOOLEAN DEFAULT FALSE,
      theme_color TEXT DEFAULT '#3B82F6',
      avatar_emoji TEXT DEFAULT '🧑‍💻',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id SERIAL PRIMARY KEY,
      ticker TEXT NOT NULL UNIQUE,
      user_id TEXT,
      added_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY,
      ticker TEXT NOT NULL,
      shares REAL NOT NULL,
      avg_cost REAL NOT NULL,
      note TEXT,
      user_id TEXT,
      added_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      ticker TEXT NOT NULL,
      content TEXT,
      user_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cache (
      ticker TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (ticker, type)
    )
  `)
}

export default pool
