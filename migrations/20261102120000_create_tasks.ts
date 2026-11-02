import type { Knex } from 'knex';

const STATUSES = ['TODO', 'IN_PROGRESS', 'ON_HOLD', 'DONE'];

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 200).notNullable();
    table.text('description').nullable();
    table.string('status', 20).notNullable().defaultTo('TODO');
    table.timestamp('due_at', { useTz: true }).notNullable();
    table.timestamps(true, true);

    table.index(['due_at']);
    table.index(['status']);
  });

  const allowed = STATUSES.map((s) => `'${s}'`).join(', ');
  await knex.raw(
    `ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN (${allowed}))`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('tasks');
}

