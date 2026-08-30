const { test, expect } = require('@playwright/test')

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('affiche la page de connexion', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'HRFlow' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Connexion' })).toBeVisible()
})

test('permet de renseigner email et mot de passe', async ({ page }) => {
  await page.getByPlaceholder('Email').fill('user@example.com')
  await page.getByPlaceholder('Mot de passe').fill('password')
  await expect(page.getByPlaceholder('Email')).toHaveValue('user@example.com')
  await expect(page.getByPlaceholder('Mot de passe')).toHaveValue('password')
})

test('envoie les identifiants a l API', async ({ page }) => {
  await page.route('**/api/auth/login', async route => {
    expect(route.request().postDataJSON()).toEqual({ email: 'user@example.com', password: 'password' })
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Invalid credentials' }) })
  })
  await page.getByPlaceholder('Email').fill('user@example.com')
  await page.getByPlaceholder('Mot de passe').fill('password')
  await page.getByRole('button', { name: 'Connexion' }).click()
  await expect(page.getByText('Identifiants invalides')).toBeVisible()
})

test('affiche une erreur pour des identifiants invalides', async ({ page }) => {
  await page.route('**/api/auth/login', route => route.fulfill({ status: 401, body: '{}' }))
  await page.getByPlaceholder('Email').fill('invalid@example.com')
  await page.getByPlaceholder('Mot de passe').fill('wrong')
  await page.getByRole('button', { name: 'Connexion' }).click()
  await expect(page.locator('.error')).toHaveText('Identifiants invalides')
})

test('stocke la session apres une connexion valide', async ({ page }) => {
  await page.route('**/api/auth/login', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ token: 'e2e-token', user: { id: 1, email: 'user@example.com', role: 'admin' } }),
  }))
  await page.getByPlaceholder('Email').fill('user@example.com')
  await page.getByPlaceholder('Mot de passe').fill('password')
  await page.getByRole('button', { name: 'Connexion' }).click()
  await page.waitForURL('**/dashboard')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('hrflow_token'))).toBe('e2e-token')
})