import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('tasks').whereNull('description').update({ description: '' });
  await knex.schema.alterTable('tasks', (table) => {
    table.text('description').notNullable().defaultTo('').alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tasks', (table) => {
    table.text('description').nullable().alter();
  });
}
