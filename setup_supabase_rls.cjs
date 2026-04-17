/**
 * 通过 pg 模块直连 Supabase PostgreSQL 执行 RLS 安全策略
 */
const { Client } = require('pg');
const fs = require('fs');

const SQL_FILE = '/tmp/notes_full_setup.sql';
const DB_URL = 'postgresql://postgres.fczherphuixpdjuevzsh:Sb@7002005_12345@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function main() {
  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  console.log(`SQL 文件已读取，${sql.split('\n').length} 行`);
  
  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false } // Supabase 需要 SSL
  });

  try {
    console.log('连接 Supabase 数据库...');
    await client.connect();
    console.log('✅ 连接成功');
    
    console.log('执行建表 + RLS SQL...');
    await client.query(sql);
    console.log('✅ SQL 执行成功');
    
    // 验证 RLS 状态
    const rlsCheck = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname='public' AND tablename='notes'
    `);
    console.log('RLS 状态:', JSON.stringify(rlsCheck.rows));
    
    // 验证 policy
    const policyCheck = await client.query(`
      SELECT policyname, cmd, qual 
      FROM pg_policies 
      WHERE tablename = 'notes'
    `);
    console.log('Policy 列表:', JSON.stringify(policyCheck.rows));
    
  } catch (err) {
    console.error('❌ 错误:', err.message);
    if (err.code) console.error('PostgreSQL Error Code:', err.code);
  } finally {
    await client.end();
    console.log('连接已关闭');
  }
}

main();
