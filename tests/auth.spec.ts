import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the auth page
    await page.goto('/');
    // Wait for the auth form to be visible
    await page.waitForSelector('text="Sign In"');
  });

  test('should display login and register forms', async ({ page }) => {
    // Check that the auth page has both sign in and sign up tabs
    await expect(page.locator('text="Sign In"')).toBeVisible();
    await expect(page.locator('text="Sign Up"')).toBeVisible();

    // Check that the default tab is Sign In
    await expect(page.locator('button[value="signin"]')).toHaveAttribute('data-state', 'active');
  });

  test('should show validation errors for empty fields on login', async ({ page }) => {
    // Click Sign In without filling fields
    await page.click('button:text("Sign In")');

    // Check for error message
    await expect(page.locator('text="Please fill in all fields"')).toBeVisible();
  });

  test('should show validation errors for empty fields on register', async ({ page }) => {
    // Switch to Sign Up tab
    await page.click('text="Sign Up"');

    // Click Create Account without filling fields
    await page.click('button:text("Create Account")');

    // Check for error message
    await expect(page.locator('text="Please fill in all fields"')).toBeVisible();
  });

  test('should show password validation error on register', async ({ page }) => {
    // Switch to Sign Up tab
    await page.click('text="Sign Up"');

    // Fill fields with short password
    await page.fill('input[id="signup-name"]', 'Test User');
    await page.fill('input[id="signup-email"]', 'test@example.com');
    await page.fill('input[id="signup-password"]', '123'); // Too short

    // Click Create Account
    await page.click('button:text("Create Account")');

    // Check for password length error
    await expect(page.locator('text="Password must be at least 6 characters long"')).toBeVisible();
  });

  test('should attempt login with invalid credentials', async ({ page }) => {
    // Fill invalid credentials
    await page.fill('input[id="signin-email"]', 'invalid@example.com');
    await page.fill('input[id="signin-password"]', 'wrongpassword');

    // Click Sign In
    await page.click('button:text("Sign In")');

    // Check for loading state first
    await expect(page.locator('text="Signing In..."')).toBeVisible();

    // Wait for error response (since we're not mocking, it should fail with network error or auth error)
    await page.waitForSelector('text="fetching failed"', { timeout: 10000 }).catch(async () => {
      // If no fetching failed message, check for other auth errors
      const errorVisible = await page.locator('.text-destructive').isVisible();
      expect(errorVisible).toBe(true);
    });
  });

  test('should attempt register with valid data', async ({ page }) => {
    // Switch to Sign Up tab
    await page.click('text="Sign Up"');

    // Fill valid registration data
    await page.fill('input[id="signup-name"]', 'Test User');
    await page.fill('input[id="signup-email"]', `test${Date.now()}@example.com`);
    await page.fill('input[id="signup-password"]', 'testpassword123');

    // Click Create Account
    await page.click('button:text("Create Account")');

    // Check for loading state
    await expect(page.locator('text="Creating Account..."')).toBeVisible();

    // Wait for either success or error (network/fetching failed)
    await page.waitForSelector('text="fetching failed"', { timeout: 10000 }).catch(async () => {
      // If no fetching failed, check for success message or other errors
      const successVisible = await page.locator('text="Please check your email"').isVisible();
      const errorVisible = await page.locator('.text-destructive').isVisible();

      expect(successVisible || errorVisible).toBe(true);
    });
  });

  test('should show forgot password dialog', async ({ page }) => {
    // Click Forgot Password link
    await page.click('text="Forgot your password?"');

    // Check that dialog opens
    await expect(page.locator('text="Reset Password"')).toBeVisible();
    await expect(page.locator('text="Enter your email address"')).toBeVisible();
  });

  test('should attempt password reset', async ({ page }) => {
    // Click Forgot Password link
    await page.click('text="Forgot your password?"');

    // Fill email
    await page.fill('input[id="forgot-email"]', 'test@example.com');

    // Click Send Reset Link
    await page.click('button:text("Send Reset Link")');

    // Check for loading state
    await expect(page.locator('text="Sending Reset Link..."')).toBeVisible();

    // Wait for success or error
    await page.waitForSelector('text="fetching failed"', { timeout: 10000 }).catch(async () => {
      const successVisible = await page.locator('text="Password reset email sent!"').isVisible();
      const errorVisible = await page.locator('.text-destructive').isVisible();

      expect(successVisible || errorVisible).toBe(true);
    });
  });

  test('should show social auth buttons', async ({ page }) => {
    // Check that social auth buttons are present
    await expect(page.locator('text="Google"')).toBeVisible();
    await expect(page.locator('text="Facebook"')).toBeVisible();
  });

  test('should attempt Google auth', async ({ page }) => {
    // Click Google button
    await page.click('button:text("Google")');

    // Check for loading state or error
    await page.waitForSelector('text="fetching failed"', { timeout: 10000 }).catch(async () => {
      // May redirect or show error
      const errorVisible = await page.locator('text="Google authentication is not yet configured"').isVisible();
      const currentUrl = page.url();

      expect(errorVisible || !currentUrl.includes('localhost')).toBe(true);
    });
  });

  test('should show password toggle functionality', async ({ page }) => {
    // Check password input type initially
    const passwordInput = page.locator('input[id="signin-password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click eye icon to show password
    await page.click('button[aria-label="Toggle password visibility"]');

    // Check that password is now visible
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide
    await page.click('button[aria-label="Toggle password visibility"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});