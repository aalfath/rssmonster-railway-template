// First-boot and every-boot preparation for RSSMonster on Railway:
// 1. wait for MySQL, 2. run Sequelize migrations under a MySQL named lock
// (overlapping deploys can't migrate twice), 3. create the admin account if no user exists.
import { spawnSync } from 'node:child_process';
import mysql from 'mysql2/promise';

const required = ['DB_HOSTNAME', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE', 'JWT_SECRET', 'FEVER_CREDENTIAL_SECRET'];
const missing = required.filter(name => !process.env[name]);
if (missing.length) {
  console.error(`[railway] Missing required variables: ${missing.join(', ')}`);
  process.exit(1);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const connect = async () => {
  const deadline = Date.now() + 5 * 60 * 1000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      return await mysql.createConnection({
        host: process.env.DB_HOSTNAME,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        connectTimeout: 10000
      });
    } catch (error) {
      lastError = error;
      console.log(`[railway] Waiting for MySQL (${error.code || error.message})...`);
      await sleep(3000);
    }
  }
  throw lastError;
};

const run = async () => {
  const connection = await connect();
  console.log('[railway] MySQL is reachable.');

  const [[{ locked }]] = await connection.query("SELECT GET_LOCK('rssmonster_railway_prepare', 600) AS locked");
  if (locked !== 1) throw new Error('Could not acquire the migration lock within 10 minutes');

  try {
    const migrate = spawnSync('node', ['node_modules/.bin/sequelize', 'db:migrate'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
      encoding: 'utf8'
    });
    if (migrate.status !== 0) {
      console.error(migrate.stdout?.slice(-4000));
      console.error(migrate.stderr?.slice(-4000));
      throw new Error(`Migrations failed with exit code ${migrate.status}`);
    }
    const applied = (migrate.stdout.match(/migrated/g) || []).length;
    console.log(`[railway] Migrations up to date (${applied} applied now).`);

    await bootstrapAdmin();
  } finally {
    await connection.query("SELECT RELEASE_LOCK('rssmonster_railway_prepare')").catch(() => {});
    await connection.end().catch(() => {});
  }
};

const bootstrapAdmin = async () => {
  const { default: db } = await import('./models/index.js');
  const { default: bcrypt } = await import('bcryptjs');
  const { createFeverApiKey, createFeverCredentialHash } = await import('./utils/apiCredentials.js');
  const { User } = db;
  try {
    const count = await User.count();
    if (count > 0) {
      console.log(`[railway] ${count} account(s) exist; admin bootstrap skipped.`);
      return;
    }
    const username = (process.env.ADMIN_USERNAME || 'admin').trim();
    const password = process.env.ADMIN_PASSWORD || '';
    if (username.length < 3) throw new Error('ADMIN_USERNAME must have at least 3 characters');
    if (password.length < 12) throw new Error('ADMIN_PASSWORD must have at least 12 characters');
    await User.create({
      username,
      email: null,
      password: await bcrypt.hash(password, 10),
      feverCredentialHash: createFeverCredentialHash(createFeverApiKey(username, password)),
      role: 'admin',
      bootstrapAdminClaim: true
    });
    console.log(`[railway] Admin account "${username}" created.`);
  } finally {
    await db.sequelize.close().catch(() => {});
  }
};

try {
  await run();
  process.exit(0);
} catch (error) {
  console.error('[railway] Startup preparation failed:', error?.message || error);
  process.exit(1);
}
