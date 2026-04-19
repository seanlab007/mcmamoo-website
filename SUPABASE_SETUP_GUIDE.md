# FaceFusion Supabase 手动配置指南

## 1. 创建 Storage Buckets

访问: https://supabase.com/dashboard/project/fczherphuixpdjuevzsh/storage

点击 **New bucket**，创建两个 buckets：

| Bucket Name | Public | Purpose |
|-------------|--------|---------|
| `facefusion` | ✅ Yes | 存储上传的图片/视频 |
| `facefusion-output` | ✅ Yes | 存储处理结果 |

## 2. 执行数据库 SQL

访问: https://supabase.com/dashboard/project/fczherphuixpdjuevzsh/sql/new

粘贴并执行 `supabase/facefusion_schema.sql` 的内容。

## 3. 验证配置

执行以下 SQL 验证：
```sql
-- 检查表是否创建成功
SELECT * FROM public.facefusion_tasks LIMIT 1;

-- 检查存储桶是否创建成功
SELECT * FROM storage.buckets WHERE name LIKE '%facefusion%';
```

## 4. 配置 CORS（如果需要）

Storage buckets 创建后，确保 CORS 设置允许你的域名访问。

## 5. 环境变量配置

在后端环境变量中添加：
```bash
SUPABASE_URL=https://fczherphuixpdjuevzsh.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY0MzQ5MSwiZXhwIjoyMDg5MjE5NDkxfQ.XgyphQNQtmOPx1hFl5WyL5W_FCLOW8iX6k5ryf9KNIg
```
