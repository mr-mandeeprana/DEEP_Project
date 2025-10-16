const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Admin credentials - using environment variables for security
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'this.application.deep@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '@#$Deep123';
const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || 'Platform Administrator';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rqjzzxwfnuowxxildmnq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxanp6eHdmbnVvd3h4aWxkbW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA4OTQ5NSwiZXhwIjoyMDc0NjY1NDk1fQ.fyjR0AyUfGybFD3hQXFzKMN163IAK7xMGaADDHiDtmo';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminAccount() {
  try {
    console.log('🚀 Creating admin account...');
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
    console.log(`👤 Display Name: ${ADMIN_DISPLAY_NAME}`);

    // Validate password strength
    if (ADMIN_PASSWORD.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      return;
    }

    console.log('🔐 Password validation passed');

    // Create the user account with Supabase Auth
    console.log('📝 Creating user account in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD, // Supabase handles the actual password hashing
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  Admin account already exists, updating role...');

        // Get existing user
        const { data: existingUser, error: userError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', ADMIN_EMAIL)
          .single();

        if (userError || !existingUser) {
          console.error('❌ Could not find existing admin user');
          return;
        }

        await ensureAdminRole(existingUser.user_id);
        console.log('✅ Admin role updated successfully');
        return;
      }

      console.error('❌ Failed to create admin account:', authError.message);
      return;
    }

    if (!authData.user) {
      console.error('❌ User creation failed - no user data returned');
      return;
    }

    console.log('✅ Admin user account created in Supabase Auth');

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        user_id: authData.user.id,
        display_name: ADMIN_DISPLAY_NAME,
        credits: 10000, // Give admin plenty of credits
        role: 'admin',
      }]);

    if (profileError) {
      console.error('❌ Failed to create admin profile:', profileError.message);
      return;
    }

    console.log('✅ Admin profile created');

    // Create superadmin role
    await ensureAdminRole(authData.user.id);

    // Log the admin account creation
    try {
      await supabase
        .from('audit_logs')
        .insert([{
          user_id: 'system',
          action: 'ADMIN_ACCOUNT_CREATED',
          table_name: 'profiles',
          record_id: authData.user.id,
          new_data: {
            email: ADMIN_EMAIL,
            display_name: ADMIN_DISPLAY_NAME,
            role: 'superadmin'
          }
        }]);
      console.log('✅ Admin creation logged in audit trail');
    } catch (logError) {
      console.warn('⚠️  Could not log admin creation:', logError.message);
    }

    console.log('🎉 Admin account created successfully!');
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
    console.log(`👤 Display Name: ${ADMIN_DISPLAY_NAME}`);
    console.log(`🔐 Role: Super Admin`);
    console.log(`💰 Credits: 10,000`);
    console.log('');
    console.log('⚠️  IMPORTANT: Please check your email and confirm the account before logging in.');
    console.log('🔑 The provided password will work once the account is confirmed.');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function ensureAdminRole(userId) {
  try {
    // Check if superadmin role already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!existingRole) {
      // Create superadmin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role: 'superadmin'
        }]);

      if (roleError) {
        console.error('❌ Failed to create superadmin role:', roleError.message);
      } else {
        console.log('✅ Superadmin role assigned');
      }
    } else {
      // Update to superadmin if not already
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: 'superadmin' })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Failed to update admin role:', updateError.message);
      } else {
        console.log('✅ Superadmin role updated');
      }
    }
  } catch (error) {
    console.error('❌ Error ensuring admin role:', error.message);
  }
}

// Run the script
createAdminAccount()
  .then(() => {
    console.log('🏁 Admin account setup complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });