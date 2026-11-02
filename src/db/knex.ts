import knex from 'knex';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and try again.');
}

export const db = knex({
  client: 'pg',
  connection: connectionString,
});
