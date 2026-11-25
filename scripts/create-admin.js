import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE;
const adminEmail = process.env.ADMIN_EMAIL || 'admin@docimdagringa.com';
const adminPassword = process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !serviceRoleKey || !adminPassword) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE, ADMIN_PASSWORD');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createAdmin() {
  console.log(`Creating admin user: ${adminEmail}...`);

  const { data: { user }, error: createUserError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });

  if (createUserError || !user) {
    console.error('Error creating user:', createUserError?.message || 'No user returned');
    process.exit(1);
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: adminEmail,
      role: 'admin',
      store: 'docimdagringa',
    });

  if (profileError) {
    console.error('Error creating profile:', profileError.message);
    process.exit(1);
  }

  console.log('Admin profile created successfully.');
}

createAdmin();
