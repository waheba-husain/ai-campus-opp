require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey ||
    supabaseUrl.includes('your-project') ||
    supabaseSecretKey.includes('your_secret_key')) {
  console.error('❌ Supabase credentials not configured in .env');
  process.exit(1);
}

// Parse the Supabase URL to get connection parameters
// Format: https://<project-ref>.supabase.co
const url = new URL(supabaseUrl);
const projectRef = url.hostname.split('.')[0];

// Supabase PostgreSQL connection string format:
// postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
// But we can also use the direct connection:
// postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
// For service role, we need to use the service role key as password

// Extract password from service role key (it's a JWT, but we can use it directly as password for Supabase)
// Actually, Supabase expects the service role key as the password when using the connection pooler
const host = `db.${projectRef}.supabase.co`;
const port = 5432;
const database = 'postgres';
const user = 'postgres';
const password = supabaseSecretKey;

const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;

console.log('🔗 Connecting to:', host);

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL');

    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Running migration: 001_initial_schema.sql');

    // Execute the entire SQL as one block
    await client.query(sql);
    console.log('✅ Migration executed successfully');

    // Verify tables exist
    console.log('\n🔍 Verifying tables...');
    const tables = ['profiles', 'opportunities', 'opportunity_matches', 'pipeline'];

    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ ${table}: EXISTS (${result.rows[0].count} rows)`);
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    // Show RLS policies
    console.log('\n🔒 Checking RLS policies...');
    const policiesResult = await client.query(`
      SELECT tablename, policyname, permissive
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `);

    policiesResult.rows.forEach(p => {
      console.log(`  ${p.tablename}.${p.policyname} (${p.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'})`);
    });

    // Show table columns
    console.log('\n📋 Table schemas:');
    for (const table of tables) {
      const colsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table]);
      console.log(`\n  ${table}:`);
      colsResult.rows.forEach(c => {
        console.log(`    ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''} ${c.column_default ? `DEFAULT ${c.column_default}` : ''}`);
      });
    }

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err.stack);
  } finally {
    await client.end();
  }
}

runMigration();