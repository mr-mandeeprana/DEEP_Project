# Admin Account Setup Guide

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)
```bash
# Install dependencies first
npm install

# Run the admin setup script
node scripts/setup-admin.js
```

### Option 2: Manual Setup
```bash
# Create admin account manually
node scripts/create-admin.js
```

### Option 3: Secure Environment-Based Setup (Recommended)
```bash
# Set environment variables first
export ADMIN_EMAIL=your-admin@example.com
export ADMIN_PASSWORD=your-secure-password
export ADMIN_DISPLAY_NAME="Platform Administrator"
export ADMIN_INITIAL_CREDITS=10000

# Run secure setup
node scripts/secure-admin-setup.js
```

## 📋 Prerequisites

1. **Environment Variables**: Ensure you have the following in your `.env` file:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

    # Optional: Admin Account Configuration
    ADMIN_EMAIL=this.application.deep@gmail.com
    ADMIN_PASSWORD=your_secure_password_here
    ADMIN_DISPLAY_NAME=Platform Administrator
    ADMIN_INITIAL_CREDITS=10000
    ```

2. **Supabase Tables**: Make sure these tables exist in your database:
   - `profiles`
   - `user_roles`
   - `audit_logs`

## 👤 Designated Admin Account

The system automatically grants **Super Admin** privileges to users with this email:
- **Email**: `this.application.deep@gmail.com`
- **Password**: Set during account creation (hashed and stored securely)

## 🔐 Security Features

### Password Security
- Passwords are securely handled by Supabase Auth (bcrypt with appropriate salt rounds)
- Admin credentials can be configured via environment variables
- Password strength validation is enforced
- No hardcoded passwords in source code

### Role-Based Access Control
- **Super Admin**: Full system access, can manage all users and settings
- **Admin**: Can manage content and moderate users
- **Moderator**: Can review and moderate content
- **Viewer**: Read-only access to admin dashboard

### Audit Logging
- All admin actions are logged with timestamps
- Login attempts and security events are tracked
- Export functionality for compliance requirements

## 📊 Admin Panel Features

### Dashboard
- Real-time platform statistics
- User engagement metrics
- System health monitoring
- Quick action shortcuts

### User Management
- Complete user lifecycle management (CRUD operations)
- Role assignment and permission management
- Bulk operations and CSV export
- User activity monitoring

### Content Moderation
- Post and comment moderation
- Flagging system for inappropriate content
- Approval/rejection workflows
- Automated moderation queues

### Analytics & Reporting
- Comprehensive analytics dashboard
- User behavior insights
- Revenue and engagement tracking
- Custom reporting capabilities

### Audit & Security
- Complete audit trail
- Security monitoring dashboard
- Failed login tracking
- IP-based security controls

## 🔑 Admin Login Process

1. **Access**: Navigate to `/admin-login` or `/admin/login`
2. **Credentials**: Use the designated admin email and password
3. **Verification**: System automatically checks for admin privileges
4. **Dashboard**: Redirected to full admin panel upon successful login

## 🛡️ Security Best Practices

### Password Management
- Change default passwords immediately after setup
- Use strong, unique passwords
- Enable two-factor authentication if available

### Access Control
- Regularly review and update user roles
- Remove admin access for inactive accounts
- Monitor login patterns for suspicious activity

### Data Protection
- Regularly backup admin audit logs
- Export user data for compliance
- Keep service role keys secure and never expose in client code

## 📞 Support

If you encounter issues during setup:

1. **Check Environment Variables**: Ensure all required env vars are set
2. **Database Connection**: Verify Supabase connection and table existence
3. **Permissions**: Confirm service role key has necessary permissions
4. **Logs**: Check browser console and server logs for error details

## 🆘 Troubleshooting

### Common Issues

**"Failed to create admin account"**
- Check database permissions
- Verify environment variables
- Ensure Supabase service is running

**"Access denied. Admin privileges required"**
- Verify the email matches the designated admin email
- Check if user_roles table has the correct entry
- Confirm account is confirmed/verified

**"Environment variables missing"**
- Copy `.env.example` to `.env`
- Fill in your Supabase credentials
- Restart the development server

## 📚 API Reference

### Admin Setup Script
```javascript
// Setup admin account programmatically
const { setupAdminAccount } = require('./scripts/setup-admin');

// Or create individual admin
const adminData = {
  email: 'admin@example.com',
  displayName: 'Administrator',
  role: 'superadmin'
};
```

### Admin Role Checking
```javascript
import { useAdminRole } from '@/hooks/useAdminRole';

const { isSuperAdmin, hasRole, canManageUsers } = useAdminRole();

// Check specific permissions
if (hasRole('admin')) {
  // User has admin or higher privileges
}

if (canManageUsers) {
  // User can perform user management actions
}
```

## 🔄 Updates & Maintenance

- **Regular Updates**: Keep admin roles and permissions up to date
- **Security Patches**: Monitor and apply security updates
- **Audit Reviews**: Regularly review admin action logs
- **User Cleanup**: Remove inactive admin accounts periodically

---

**Note**: This admin system is designed for production use with proper security measures. Always follow security best practices and keep sensitive credentials secure.