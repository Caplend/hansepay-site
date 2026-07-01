'use strict';
const { pool } = require('../db');

const DEFAULT_CURRENCIES = [
  { code: 'EUR', name: 'Euro', symbol: '€', country: 'EU', flatFee: 0, varFee: 0 },
  { code: 'USD', name: 'US Dollar', symbol: '$', country: 'US', flatFee: 0, varFee: 0.5 },
  { code: 'GBP', name: 'British Pound', symbol: '£', country: 'GB', flatFee: 0, varFee: 0.5 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', country: 'CH', flatFee: 0, varFee: 0.5 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'JP', flatFee: 0, varFee: 0.75 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'CN', flatFee: 0, varFee: 0 },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', country: 'AR', flatFee: 0, varFee: 0.95 },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', country: 'BD', flatFee: 0, varFee: 0 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', country: 'BR', flatFee: 0, varFee: 0 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', country: 'EG', flatFee: 0, varFee: 0 },
];

function rowToCurrency(row) {
  return {
    code: row.code,
    name: row.name,
    symbol: row.symbol,
    country: row.country,
    flatFee: Number(row.flat_fee),
    varFee: Number(row.var_fee),
  };
}

async function insert(conn, cur) {
  await conn.query(
    `INSERT INTO currencies (code, name, symbol, country, flat_fee, var_fee)
     VALUES (:code, :name, :symbol, :country, :flatFee, :varFee)`,
    { code: cur.code, name: cur.name, symbol: cur.symbol ?? null, country: cur.country ?? null,
      flatFee: cur.flatFee ?? 0, varFee: cur.varFee ?? 0 }
  );
}

/** Mirrors the old getCurrencies(): seeds DEFAULT_CURRENCIES if the table is empty. */
async function list() {
  const [rows] = await pool.query('SELECT * FROM currencies');
  if (rows.length > 0) return rows.map(rowToCurrency);
  for (const cur of DEFAULT_CURRENCIES) await insert(pool, cur);
  return DEFAULT_CURRENCIES;
}

async function create({ code, name, symbol, country, flatFee, varFee }) {
  const entry = { code: code.toUpperCase(), name, symbol: symbol || '', country: country || '',
    flatFee: parseFloat(flatFee) || 0, varFee: parseFloat(varFee) || 0 };
  await insert(pool, entry);
  return entry;
}

async function updateFees(code, { flatFee, varFee }) {
  const sets = [];
  const params = { code: code.toUpperCase() };
  if (flatFee !== undefined) { sets.push('flat_fee = :flatFee'); params.flatFee = parseFloat(flatFee) || 0; }
  if (varFee !== undefined) { sets.push('var_fee = :varFee'); params.varFee = parseFloat(varFee) || 0; }
  if (!sets.length) return findByCode(code);
  await pool.query(`UPDATE currencies SET ${sets.join(', ')} WHERE code = :code`, params);
  return findByCode(code);
}

async function findByCode(code) {
  const [rows] = await pool.query('SELECT * FROM currencies WHERE code = :code', { code: code.toUpperCase() });
  return rows[0] ? rowToCurrency(rows[0]) : null;
}

async function remove(code) {
  const [result] = await pool.query('DELETE FROM currencies WHERE code = :code', { code: code.toUpperCase() });
  return result.affectedRows > 0;
}

module.exports = { list, create, updateFees, findByCode, remove };
