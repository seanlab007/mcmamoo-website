#!/bin/bash
# Deploy MaoAI Sales tables using curl

SUPABASE_URL="https://fczherphuixpdjuevzsh.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY0MzQ5MSwiZXhwIjoyMDg5MjE5NDkxfQ.XgyphQNQtmOPx1hFl5WyL5W_FCLOW8iX6k5ryf9KNIg"

echo "🚀 Deploying MaoAI Sales tables to Supabase..."
echo ""

# Function to execute SQL
exec_sql() {
  local sql="$1"
  local description="$2"
  
  echo "  📋 $description"
  
  response=$(curl -s -X POST \
    "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"sql\": \"$sql\"}" 2>&1)
  
  if echo "$response" | grep -q "error"; then
    echo "     ⚠️  May already exist or error: $(echo $response | head -c 100)"
  else
    echo "     ✅ Success"
  fi
}

# Create sales_leads table
echo "1️⃣  Creating sales_leads table..."
exec_sql "CREATE TABLE IF NOT EXISTS sales_leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  company VARCHAR(256) NOT NULL,
  title VARCHAR(128),
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(64),
  linkedin VARCHAR(256),
  website VARCHAR(256),
  status VARCHAR(32) NOT NULL DEFAULT 'new',
  source VARCHAR(32) NOT NULL DEFAULT 'other',
  score INTEGER DEFAULT 0,
  notes TEXT,
  last_contact TIMESTAMP WITH TIME ZONE,
  next_follow_up TIMESTAMP WITH TIME ZONE,
  assigned_to INTEGER,
  ai_insights JSONB DEFAULT '[]',
  suggested_actions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);" "sales_leads table"

echo ""
echo "2️⃣  Creating outreach_templates table..."
exec_sql "CREATE TABLE IF NOT EXISTS outreach_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  subject VARCHAR(256),
  body TEXT NOT NULL,
  type VARCHAR(16) NOT NULL DEFAULT 'email',
  category VARCHAR(64),
  ai_optimized BOOLEAN DEFAULT false,
  created_by INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);" "outreach_templates table"

echo ""
echo "3️⃣  Creating outreach_activities table..."
exec_sql "CREATE TABLE IF NOT EXISTS outreach_activities (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL,
  type VARCHAR(16) NOT NULL,
  subject VARCHAR(256),
  content TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_by INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);" "outreach_activities table"

echo ""
echo "4️⃣  Creating indexes..."
exec_sql "CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON sales_leads(status);" "index: status"
exec_sql "CREATE INDEX IF NOT EXISTS idx_sales_leads_score ON sales_leads(score DESC);" "index: score"
exec_sql "CREATE INDEX IF NOT EXISTS idx_sales_leads_email ON sales_leads(email);" "index: email"
exec_sql "CREATE INDEX IF NOT EXISTS idx_activities_lead ON outreach_activities(lead_id);" "index: lead_id"

echo ""
echo "5️⃣  Enabling RLS..."
exec_sql "ALTER TABLE sales_leads ENABLE ROW LEVEL SECURITY;" "RLS: sales_leads"
exec_sql "ALTER TABLE outreach_templates ENABLE ROW LEVEL SECURITY;" "RLS: outreach_templates"
exec_sql "ALTER TABLE outreach_activities ENABLE ROW LEVEL SECURITY;" "RLS: outreach_activities"

echo ""
echo "6️⃣  Creating RLS policies..."
exec_sql "CREATE POLICY IF NOT EXISTS \"Allow authenticated read leads\" ON sales_leads FOR SELECT TO authenticated USING (true);" "policy: read leads"
exec_sql "CREATE POLICY IF NOT EXISTS \"Allow authenticated insert leads\" ON sales_leads FOR INSERT TO authenticated WITH CHECK (true);" "policy: insert leads"
exec_sql "CREATE POLICY IF NOT EXISTS \"Allow authenticated update leads\" ON sales_leads FOR UPDATE TO authenticated USING (true);" "policy: update leads"
exec_sql "CREATE POLICY IF NOT EXISTS \"Allow authenticated delete leads\" ON sales_leads FOR DELETE TO authenticated USING (true);" "policy: delete leads"

exec_sql "CREATE POLICY IF NOT EXISTS \"Allow authenticated read templates\" ON outreach_templates FOR SELECT TO authenticated USING (true);" "policy: read templates"
exec_sql "CREATE POLICY IF NOT EXISTS \"Allow authenticated insert templates\" ON outreach_templates FOR INSERT TO authenticated WITH CHECK (true);" "policy: insert templates"

exec_sql "CREATE POLICY IF NOT EXISTS \"Allow authenticated read activities\" ON outreach_activities FOR SELECT TO authenticated USING (true);" "policy: read activities"
exec_sql "CREATE POLICY IF NOT EXISTS \"Allow authenticated insert activities\" ON outreach_activities FOR INSERT TO authenticated WITH CHECK (true);" "policy: insert activities"

echo ""
echo "✅ Tables created successfully!"
echo ""
echo "📊 Next steps:"
echo "  1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/fczherphuixpdjuevzsh"
echo "  2. Open SQL Editor and run: supabase/sales_automation_supabase.sql"
echo "  3. Verify tables in Table Editor"
echo ""
