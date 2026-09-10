'use strict';
const { pool } = require('../db');

function rowToTask(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    title: row.title,
    dueDate: row.due_date ? new Date(row.due_date).toISOString().slice(0, 10) : null,
    done: !!row.done,
    doneAt: row.done_at ? row.done_at.toISOString() : null,
    createdBy: row.created_by,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

async function forCustomer(customerId) {
  const [rows] = await pool.query(
    'SELECT * FROM tasks WHERE customer_id = :customerId ORDER BY done ASC, (due_date IS NULL) ASC, due_date ASC, created_at ASC',
    { customerId }
  );
  return rows.map(rowToTask);
}

// All open (not done) tasks due today or earlier, with the customer's company
// name joined in — powers the Bookings "Follow-ups due" card and the daily
// reminder email, across all customers in one query.
async function dueTasks(today) {
  const [rows] = await pool.query(
    `SELECT t.*, c.company AS customer_company, c.owner AS customer_owner, c.first_name AS customer_first_name, c.last_name AS customer_last_name
     FROM tasks t JOIN customers c ON c.id = t.customer_id
     WHERE t.done = 0 AND t.due_date IS NOT NULL AND t.due_date <= :today
     ORDER BY t.due_date ASC`,
    { today }
  );
  return rows.map(row => Object.assign(rowToTask(row), {
    customerCompany: row.customer_company,
    customerOwner: row.customer_owner,
    customerName: `${row.customer_first_name || ''} ${row.customer_last_name || ''}`.trim(),
  }));
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = :id', { id });
  return rows[0] ? rowToTask(rows[0]) : null;
}

async function create(task) {
  await pool.query(
    `INSERT INTO tasks (id, customer_id, title, due_date, done, created_by, created_at, updated_at)
     VALUES (:id, :customerId, :title, :dueDate, 0, :createdBy, :createdAt, :updatedAt)`,
    {
      id: task.id, customerId: task.customerId, title: task.title ?? '',
      dueDate: task.dueDate || null, createdBy: task.createdBy ?? null,
      createdAt: new Date(task.createdAt), updatedAt: new Date(task.createdAt),
    }
  );
  return findById(task.id);
}

async function update(id, patch) {
  const sets = [];
  const params = { id };
  if (patch.title !== undefined) { sets.push('title = :title'); params.title = patch.title; }
  if (patch.dueDate !== undefined) { sets.push('due_date = :dueDate'); params.dueDate = patch.dueDate || null; }
  if (patch.done !== undefined) {
    sets.push('done = :done'); params.done = patch.done ? 1 : 0;
    sets.push('done_at = :doneAt'); params.doneAt = patch.done ? new Date() : null;
  }
  sets.push('updated_at = :updatedAt'); params.updatedAt = new Date();
  await pool.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = :id`, params);
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM tasks WHERE id = :id', { id });
  return result.affectedRows > 0;
}

module.exports = { forCustomer, dueTasks, findById, create, update, remove };
