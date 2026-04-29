/**
 * 🚀 Script de Inicialização para Desenvolvimento
 * Força ambiente development com localhost
 */

// Forçar ambiente de desenvolvimento
process.env.NODE_ENV = 'development';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'rh';
process.env.DB_USER = 'rhplus_user';
process.env.DB_PASSWORD = '12Nordeste34+';

console.log('🔧 Ambiente de desenvolvimento forçado:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);

// Iniciar servidor
require('./server.js');
