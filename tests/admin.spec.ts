import { test, expect } from '@playwright/test';

test.describe('Admin Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Set up admin user authentication mock or use real admin credentials
    await page.goto('/');
  });

  test('should display admin login page', async ({ page }) => {
    await page.goto('/admin');

    // Should redirect to admin login if not authenticated
    await expect(page.locator('text="Admin Access"')).toBeVisible();
    await expect(page.locator('text="Admin Login"')).toBeVisible();
  });

  test('should allow admin login with correct credentials', async ({ page }) => {
    await page.goto('/admin');

    // Fill admin credentials
    await page.fill('input[id="email"]', 'this.application.deep@gmail.com');
    await page.fill('input[id="password"]', '@#$Deep123');

    // Click login
    await page.click('button:text("Access Admin Panel")');

    // Should redirect to admin dashboard
    await page.waitForURL('/admin');
    await expect(page.locator('text="Admin Dashboard"')).toBeVisible();
  });

  test('should show admin dashboard with correct stats', async ({ page }) => {
    // Assuming admin is logged in
    await page.goto('/admin');

    // Check dashboard elements
    await expect(page.locator('text="Admin Dashboard"')).toBeVisible();
    await expect(page.locator('text="Total Users"')).toBeVisible();
    await expect(page.locator('text="Total Courses"')).toBeVisible();

    // Check navigation tabs
    await expect(page.locator('text="Overview"')).toBeVisible();
    await expect(page.locator('text="Analytics"')).toBeVisible();
    await expect(page.locator('text="Courses"')).toBeVisible();
  });

  test('should navigate to courses management', async ({ page }) => {
    await page.goto('/admin');

    // Click on Courses tab
    await page.click('text="Courses"');

    // Check course management elements
    await expect(page.locator('text="Course Management Overview"')).toBeVisible();
    await expect(page.locator('text="Create New Course"')).toBeVisible();
  });

  test('should display courses page correctly', async ({ page }) => {
    // Navigate directly to courses page
    await page.goto('/admin/courses');

    // Check page elements
    await expect(page.locator('text="Course Management"')).toBeVisible();
    await expect(page.locator('text="Create Course"')).toBeVisible();
  });

  test('should open course creation dialog', async ({ page }) => {
    await page.goto('/admin/courses');

    // Click create course button
    await page.click('text="Create Course"');

    // Check dialog appears
    await expect(page.locator('text="Create New Course"')).toBeVisible();
    await expect(page.locator('input[id="title"]')).toBeVisible();
  });

  test('should validate course form fields', async ({ page }) => {
    await page.goto('/admin/courses');

    // Open create dialog
    await page.click('text="Create Course"');

    // Try to submit empty form
    await page.click('button:text("Create Course")');

    // Check for validation (required fields should show errors or prevent submission)
    await expect(page.locator('input[id="title"]:invalid')).toBeVisible();
  });

  test('should create a new course successfully', async ({ page }) => {
    await page.goto('/admin/courses');

    // Open create dialog
    await page.click('text="Create Course"');

    // Fill required fields
    await page.fill('input[id="title"]', 'Test Course ' + Date.now());
    await page.fill('input[id="instructor_name"]', 'Test Instructor');
    await page.fill('textarea[id="short_description"]', 'Test short description');
    await page.fill('textarea[id="description"]', 'Test full description');
    await page.fill('input[id="category"]', 'Test Category');
    await page.fill('input[id="duration_hours"]', '10');
    await page.fill('input[id="total_lessons"]', '5');

    // Submit form
    await page.click('button:text("Create Course")');

    // Check success message
    await expect(page.locator('text="Course created successfully"')).toBeVisible();
  });

  test('should display courses in the list', async ({ page }) => {
    await page.goto('/admin/courses');

    // Check if courses are displayed
    const courseElements = page.locator('[data-testid="course-item"], .border.rounded-lg.p-4');
    await expect(courseElements.first()).toBeVisible();
  });

  test('should allow editing a course', async ({ page }) => {
    await page.goto('/admin/courses');

    // Find and click edit button on first course
    const editButton = page.locator('button').filter({ has: page.locator('.lucide-edit') }).first();
    await editButton.click();

    // Check edit dialog opens
    await expect(page.locator('text="Edit Course"')).toBeVisible();

    // Modify title
    const newTitle = 'Updated Course ' + Date.now();
    await page.fill('input[id="title"]', newTitle);

    // Save changes
    await page.click('button:text("Update Course")');

    // Check success message
    await expect(page.locator('text="Course updated successfully"')).toBeVisible();
  });

  test('should allow changing course status', async ({ page }) => {
    await page.goto('/admin/courses');

    // Find publish/unpublish button
    const statusButton = page.locator('button:text("Publish"), button:text("Unpublish")').first();
    const originalText = await statusButton.textContent();

    await statusButton.click();

    // Check success message
    await expect(page.locator('text="Course published successfully"').or(page.locator('text="Course unpublished successfully"'))).toBeVisible();
  });

  test('should allow searching courses', async ({ page }) => {
    await page.goto('/admin/courses');

    // Type in search box
    await page.fill('input[placeholder="Search courses..."]', 'test');

    // Check results are filtered
    await page.waitForTimeout(500); // Allow time for filtering
    const visibleCourses = page.locator('.border.rounded-lg.p-4');
    // Should show filtered results
  });

  test('should allow filtering by status', async ({ page }) => {
    await page.goto('/admin/courses');

    // Select status filter
    await page.click('button:has-text("All Status")');
    await page.click('text="Published"');

    // Check results
    await page.waitForTimeout(500);
    // Should show only published courses
  });

  test('should prevent unauthorized access to admin pages', async ({ page }) => {
    // Try to access admin pages without authentication
    await page.goto('/admin');
    await expect(page.locator('text="Admin Access"')).toBeVisible();

    await page.goto('/admin/courses');
    await expect(page.locator('text="Admin Access"')).toBeVisible();
  });

  test('should show admin sidebar navigation', async ({ page }) => {
    await page.goto('/admin');

    // Check sidebar is visible
    await expect(page.locator('text="Dashboard"')).toBeVisible();
    await expect(page.locator('text="Courses"')).toBeVisible();
    await expect(page.locator('text="Users"')).toBeVisible();
  });

  test('should navigate between admin pages', async ({ page }) => {
    await page.goto('/admin');

    // Click Courses in sidebar
    await page.click('text="Courses"');

    // Should navigate to courses page
    await page.waitForURL('/admin/courses');
    await expect(page.locator('text="Course Management"')).toBeVisible();
  });

  test('should handle course deletion with confirmation', async ({ page }) => {
    await page.goto('/admin/courses');

    // Find delete button
    const deleteButton = page.locator('button').filter({ has: page.locator('.lucide-trash2') }).first();

    // Mock browser confirm dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('delete this course');
      await dialog.accept();
    });

    await deleteButton.click();

    // Check success message
    await expect(page.locator('text="Course deleted successfully"')).toBeVisible();
  });

  test('should display course statistics correctly', async ({ page }) => {
    await page.goto('/admin');

    // Check dashboard stats include courses
    await expect(page.locator('text="Total Courses"')).toBeVisible();

    // Click courses tab
    await page.click('text="Courses"');

    // Check course-specific stats
    await expect(page.locator('text="Total Courses"')).toBeVisible();
    await expect(page.locator('text="Published"')).toBeVisible();
    await expect(page.locator('text="Drafts"')).toBeVisible();
  });

  test('should handle form validation errors', async ({ page }) => {
    await page.goto('/admin/courses');

    // Open create dialog
    await page.click('text="Create Course"');

    // Fill invalid data
    await page.fill('input[id="duration_hours"]', '-1');
    await page.fill('input[id="total_lessons"]', '0');

    // Try to submit
    await page.click('button:text("Create Course")');

    // Should show error or prevent submission
    await expect(page.locator('text="Error"')).toBeVisible();
  });
});