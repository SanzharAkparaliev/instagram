require('dotenv').config();
const { startScheduler } = require('./jobs/parse.job');

console.log('🤖 Instagram CRM Parser v1.0');
console.log('================================');
console.log('Backend URL:', process.env.BACKEND_URL || 'http://localhost:5000/api');

startScheduler();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Parser] Токтотулуп жатат...');
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Parser] Иштетилбеген Promise rejected:', reason);
});
