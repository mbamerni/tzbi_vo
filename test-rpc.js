const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need this for running SQL

// If no service key, we cannot easily execute raw DDL via the JS client.
// We might need to use the REST API or the CLI properly.
console.log("URL:", supabaseUrl ? "Exists" : "Missing");
console.log("Service Key:", supabaseServiceKey ? "Exists" : "Missing");
