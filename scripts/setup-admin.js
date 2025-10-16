import { createClient } from '@supabase/supabase-js';

// Configuration - Use environment variables for security
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rqjzzxwfnuowxxildmnq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxanp6eHdmbnVvd3h4aWxkbW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA4OTQ5NSwiZXhwIjoyMDc0NjY1NDk1fQ.fyjR0AyUfGybFD3hQXFzKMN163IAK7xMGaADDHiDtmo';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.log('   VITE_SUPABASE_URL or SUPABASE_URL');
  console.log('   SUPABASE_SERVICE_ROLE_KEY');
  console.log('');
  console.log('💡 For development, you can run:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_key node scripts/setup-admin.js');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Admin account details - using environment variables for security
const ADMIN_CONFIG = {
  email: process.env.ADMIN_EMAIL || 'this.application.deep@gmail.com',
  displayName: process.env.ADMIN_DISPLAY_NAME || 'Platform Administrator',
  initialCredits: parseInt(process.env.ADMIN_INITIAL_CREDITS) || 10000,
  role: 'superadmin'
};

async function setupAdminAccount() {
  try {
    console.log('🚀 Setting up admin account...');
    console.log(`📧 Email: ${ADMIN_CONFIG.email}`);
    console.log(`👤 Display Name: ${ADMIN_CONFIG.displayName}`);
    console.log('');

    // Check if admin user already exists
    const { data: existingProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .eq('display_name', ADMIN_CONFIG.displayName);

    if (profileError) {
      console.error('❌ Error checking existing profiles:', profileError.message);
      return;
    }

    let adminUserId = null;

    if (existingProfiles && existingProfiles.length > 0) {
      console.log('ℹ️  Admin profile already exists, checking auth user...');
      adminUserId = existingProfiles[0].user_id;
    }

    if (!adminUserId) {
      // Create admin user in auth system
      console.log('📝 Creating admin user in authentication system...');
      const adminPassword = process.env.ADMIN_PASSWORD || '@#$Deep123';
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_CONFIG.email,
        password: adminPassword, // Use environment variable or temporary password
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          display_name: ADMIN_CONFIG.displayName,
          role: ADMIN_CONFIG.role
        }
      });

      if (authError) {
        console.error('❌ Failed to create admin auth user:', authError.message);
        return;
      }

      adminUserId = authData.user.id;
      console.log('✅ Admin authentication user created');
    }

    // Ensure profile exists with correct data
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert([{
        user_id: adminUserId,
        display_name: ADMIN_CONFIG.displayName,
        credits: ADMIN_CONFIG.initialCredits,
        role: 'admin', // Profile role
        created_at: new Date().toISOString()
      }], { onConflict: 'user_id' });

    if (upsertError) {
      console.error('❌ Failed to create/update admin profile:', upsertError.message);
      return;
    }

    console.log('✅ Admin profile created/updated');

    // Ensure superadmin role exists
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert([{
        user_id: adminUserId,
        role: ADMIN_CONFIG.role
      }], { onConflict: 'user_id' });

    if (roleError) {
      console.error('❌ Failed to assign superadmin role:', roleError.message);
      return;
    }

    console.log('✅ Superadmin role assigned');

    // Log the admin setup
    try {
      await supabase
        .from('audit_logs')
        .insert([{
          user_id: 'system',
          action: 'ADMIN_SETUP_COMPLETED',
          table_name: 'profiles',
          record_id: adminUserId,
          new_data: {
            email: ADMIN_CONFIG.email,
            display_name: ADMIN_CONFIG.displayName,
            role: ADMIN_CONFIG.role,
            credits: ADMIN_CONFIG.initialCredits
          }
        }]);
      console.log('✅ Admin setup logged in audit trail');
    } catch (logError) {
      console.warn('⚠️  Could not log admin setup:', logError.message);
    }

    console.log('');
    console.log('🎉 Admin account setup completed successfully!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📧 Email: ${ADMIN_CONFIG.email}`);
    console.log(`👤 Display Name: ${ADMIN_CONFIG.displayName}`);
    console.log(`🔐 Role: ${ADMIN_CONFIG.role}`);
    console.log(`💰 Initial Credits: ${ADMIN_CONFIG.initialCredits}`);
    console.log(`🆔 User ID: ${adminUserId}`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('1. The admin account has been created with a temporary password');
    console.log('2. Please change the password immediately after first login');
    console.log('3. The designated admin email will always have superadmin privileges');
    console.log('4. Keep the service role key secure and never expose it in client code');
    console.log('');
    console.log('🚀 You can now log in to the admin panel at /admin');

  } catch (error) {
    console.error('❌ Unexpected error during admin setup:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAdminAccount()
    .then(() => {
      console.log('🏁 Admin setup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin setup script failed:', error);
      process.exit(1);
    });
}

export { setupAdminAccount };