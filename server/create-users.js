/* Creates the two accounts directly in SQL Server. Run: node create-users.js (or double-click create-users.bat). */
require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('./db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, (a) => r(a.trim())));
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_RE = /^[a-z0-9_.]{3,20}$/;

(async () => {
  await db.init();
  const existing = await db.countUsers();
  const max = Number(process.env.MAX_USERS || 2);
  console.log('Accounts already in the database: ' + existing + ' (max ' + max + ')');
  for (let i = existing + 1; i <= max; i++) {
    console.log('\n--- Account ' + i + ' ---');
    const name = await ask('Name (shown on the site): ');
    const username = (await ask('Username (3-20 letters/numbers, or leave empty): ')).toLowerCase().replace(/^@/, '');
    const email = (await ask('Gmail (or leave empty): ')).toLowerCase();
    const pass = await ask('Password (6+ characters): ');
    if (!name || (!username && !email) || (username && !USER_RE.test(username)) || (email && !EMAIL.test(email)) || pass.length < 6) {
      console.log('Something is missing or invalid. Run the script again.'); break;
    }
    if (await db.userExists(username, email)) { console.log('That username/Gmail already exists. Skipped.'); continue; }
    await db.createUser({ name, username, email, key: email || ('@' + username), hash: await bcrypt.hash(pass, 12) });
    console.log('Created: ' + name);
  }
  rl.close();
  process.exit(0);
})().catch((e) => { console.error('Error:', e.message); process.exit(1); });
