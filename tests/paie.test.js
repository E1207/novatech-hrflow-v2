const request = require('supertest')

jest.mock('pg', () => ({ Pool: jest.fn(() => ({ query: jest.fn() })) }))
jest.mock('axios', () => ({ post: jest.fn().mockResolvedValue({ data: { id: 'payout-test' } }) }))

const { Pool } = require('pg')
const axios = require('axios')
const app = require('../services/paie/src/index')
const pool = Pool.mock.results[0].value

beforeEach(() => {
  pool.query.mockReset()
  axios.post.mockClear()
  process.env.STRIPE_SECRET_KEY = 'test-stripe-key'
})

test('retourne 404 si le salarie est inconnu', async () => {
  pool.query.mockResolvedValueOnce({ rows: [] })
  await request(app).post('/paie/calculer').send({ employeeId: 99, mois: 1, annee: 2026 }).expect(404)
})

test('calcule le bulletin et demande le paiement', async () => {
  pool.query
    .mockResolvedValueOnce({ rows: [{ salaire_mensuel_brut: 3000 }] })
    .mockResolvedValueOnce({ rows: [] })
  const response = await request(app).post('/paie/calculer').send({ employeeId: 7, mois: 1, annee: 2026 }).expect(200)
  expect(response.body).toMatchObject({ employeeId: 7, brut: 3000, net: 2340 })
  expect(axios.post).toHaveBeenCalledWith('https://api.stripe.com/v1/payouts', { amount: 234000, currency: 'eur' }, expect.any(Object))
})

test('execute la migration demandee', async () => {
  pool.query.mockResolvedValueOnce({ rows: [] })
  await request(app).post('/paie/migrate').expect(200)
  expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('ALTER TABLE employees'))
})

test('calcule les heures supplementaires', async () => {
  pool.query.mockResolvedValueOnce({ rows: [{ salaire_mensuel_brut: 3000 }] })
  const response = await request(app).post('/paie/heures-sup').send({ employeeId: 7, heures: 10 }).expect(200)
  expect(response.body).toMatchObject({ heures: 10, tauxHoraire: expect.closeTo(19.78, 1), majorationHeuresSup: expect.closeTo(247.25, 1) })
})
