// 测试 Supabase PostgreSQL 直连
// 用法: node test-connection.mjs
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Sb@7002005_12345@db.fczherphuixpdjuevzsh.supabase.co:5432/postgres',
  connectionTimeoutMillis: 10000,
});

async function main() {
  try {
    console.log('正在连接 Supabase PostgreSQL...');
    await client.connect();
    const res = await client.query('SELECT current_database(), current_user, version();');
    console.log('✅ 连接成功！');
    console.log('Database:', res.rows[0].current_database);
    console.log('User:', res.rows[0].current_user);
    console.log('Version:', res.rows[0].version.split('\n')[0]);
  } catch (err) {
    console.error('❌ 连接失败:', err.message);
    console.error('Code:', err.code);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
