/**
 * 直连 Supabase PostgreSQL 执行 RLS 安全策略
 * ESM 模块
 */
import pg from 'pg';
const { Client } = pg;
import fs from 'fs';

const SQL_FILE = '/tmp/notes_full_setup.sql';

// 尝试多种连接格式
const CONNECTIONS = [
  // 直连 (Session mode)
  'postgresql://postgres:Sb@7002005_12345@db.fc%zherphuixpdjuevzsh.supabase.co:5432/postgres',
  // Pooler (Transaction mode) - 正确用户名格式
  'postgresql://postgres.fc%zherphuixpdjuevzsh:Sb%407002005_12345@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  // Pooler port 5432
  'postgresql://postgres.fc%zherphuixpdjuevzsh:Sb%407002005_12345@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
];

async function tryConnect(connStr) {
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  try {
    await client.connect();
    const r = await client.query('SELECT version() as v');
    console.log(`✅ 连接成功: ${connStr.slice(0, 60)}...`);
    console.log(`   ${r.rows[0].v.slice(0, 60)}...`);
    return client;
  } catch (e) {
    console.log(`❌ 失败: ${e.message}`);
    await client.end().catch(() => {});
    return null;
  }
}

async function main() {
  let client = null;
  for (const conn of CONNECTIONS) {
    console.log(`\n尝试: ${conn}`);
    client = await tryConnect(conn);
    if (client) break;
  }

  if (!client) {
    console.error('\n❌ 所有连接方式都失败了');
    process.exit(1);
  }

  try {
    const sql = fs.readFileSync(SQL_FILE, 'utf8');
    console.log('\n执行建表 + RLS SQL...');
    await client.query(sql);
    console.log('✅ SQL 执行成功！');

    // 验证 RLS
    const rls = await client.query("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename='notes'");
    console.log('RLS 状态:', JSON.stringify(rls.rows));

    const policies = await client.query("SELECT policyname, cmd FROM pg_policies WHERE tablename='notes'");
    console.log('Policies:', JSON.stringify(policies.rows));

  } finally {
    await client.end();
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
