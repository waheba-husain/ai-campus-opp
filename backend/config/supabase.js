const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

let supabase = null;

if (supabaseUrl && supabaseSecretKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseSecretKey.includes('your_secret_key')) {
  supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  console.warn('⚠️  Supabase credentials not configured or using placeholder values. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env');
  // Create a mock supabase object for development without real credentials
  supabase = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: new Error('Supabase not configured') }),
      update: () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: () => ({ data: null, error: new Error('Supabase not configured') }),
      upsert: () => ({ data: null, error: new Error('Supabase not configured') }),
      eq: function() { return this; },
      single: function() { return this; },
    }),
  };
}

module.exports = { supabase };