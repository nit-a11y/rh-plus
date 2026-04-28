/**
 * 🗄️ DATABASE - Interface de compatibilidade
 * Re-exporta config/database.js mantendo API compatível com código legado
 */

const { db, query, transaction, getPool, checkConnection } = require('./config/database');

// Exporta a interface db (run, all, get) para compatibilidade
module.exports = db;

// Exportas adicionais para código novo
module.exports.query = query;
module.exports.transaction = transaction;
module.exports.getPool = getPool;
module.exports.checkConnection = checkConnection;
