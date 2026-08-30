const request = require('supertest')
const jwt = require('jsonwebtoken')

jest.mock('pg', () => ({ Pool: jest.fn(() => ({ query: jest.fn() })) }))
jest.mock('bcrypt', () => ({ compare: jest.fn() }))

const { Pool } = require('pg')
const bcrypt = require('bcrypt')
const app = require('../services/auth/src/index')
const pool = Pool.mock.results[0].value

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret'
  pool.query.mockReset()
  bcrypt.compare.mockReset()
})

test('refuse une connexion pour un utilisateur inconnu', async () => {
  pool.query.mockResolvedValueOnce({ rows: [] })
  await request(app).post('/auth/login').send({ email: 'unknown@example.com', password: 'bad' }).expect(401)
})

test('retourne un JWT après authentification valide', async () => {
  pool.query.mockResolvedValueOnce({ rows: [{ id: 7, email: 'user@example.com', role: 'admin', password_hash: 'hash' }] })
  bcrypt.compare.mockResolvedValueOnce(true)
  const response = await request(app).post('/auth/login').send({ email: 'user@example.com', password: 'valid' }).expect(200)
  expect(response.body.user).toEqual({ id: 7, email: 'user@example.com', role: 'admin' })
  expect(jwt.verify(response.body.token, 'test-secret').userId).toBe(7)
})

test('verifie un JWT valide', async () => {
  const token = jwt.sign({ userId: 7, role: 'admin' }, 'test-secret')
  const response = await request(app).post('/auth/verify').send({ token }).expect(200)
  expect(response.body.valid).toBe(true)
})

test('rejette un JWT invalide', async () => {
  await request(app).post('/auth/verify').send({ token: 'invalid' }).expect(401)
})
