import path from 'path';
import { db } from './knex'

const config = {
  directory: path.join(__dirname, '../../migrations'),
  loadExtensions: ['.ts'],
};

async function run() {
  const command = process.argv[2];

  if (command === 'latest') {
    const [, applied] = await db.migrate.latest(config);
    console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Already up to date');
  } else if (command === 'rollback') {
    const [, rolledBack] = await db.migrate.rollback(config);
    console.log(rolledBack.length ? `Rolled back: ${rolledBack.join(', ')}` : 'Nothing to roll back');
  } else {
    throw new Error('Usage: migrate.ts latest | rollback');
  }
}

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.destroy());

