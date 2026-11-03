import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('task_status_history', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('task_id').notNullable();
    table.string('from_status', 20).nullable();
    table.string('to_status', 20).nullable();
    table.timestamp('changed_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['task_id']);
  });

  await knex.raw(`
    CREATE OR REPLACE FUNCTION record_task_status_change() RETURNS trigger AS $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        INSERT INTO task_status_history (task_id, from_status, to_status)
        VALUES (NEW.id, NULL, NEW.status);
        RETURN NEW;
      ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status IS DISTINCT FROM OLD.status THEN
          INSERT INTO task_status_history (task_id, from_status, to_status)
          VALUES (NEW.id, OLD.status, NEW.status);
        END IF;
        RETURN NEW;
      ELSE
        INSERT INTO task_status_history (task_id, from_status, to_status)
        VALUES (OLD.id, OLD.status, NULL);
        RETURN OLD;
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER tasks_record_status_change
    AFTER INSERT OR UPDATE OF status OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION record_task_status_change();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS tasks_record_status_change ON tasks');
  await knex.raw('DROP FUNCTION IF EXISTS record_task_status_change()');
  await knex.schema.dropTable('task_status_history');
}
