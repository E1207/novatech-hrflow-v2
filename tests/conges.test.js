const request = require('supertest')

jest.mock('pg', () => ({ Pool: jest.fn(() => ({ query: jest.fn() })) }))

const { Pool } = require('pg')
const app = require('../services/conges/src/index')
const pool = Pool.mock.results[0].value

beforeEach(() => pool.query.mockReset())

test('calcule le solde de conges', async () => {
  pool.query
    .mockResolvedValueOnce({ rows: [{ jours_conges_acquis: 25 }] })
    .mockResolvedValueOnce({ rows: [{ nombre_jours: 2 }] })
    .mockResolvedValueOnce({ rows: [{ nombre_jours: 1 }] })
  const response = await request(app).get('/conges/solde/12').expect(200)
  expect(response.body).toEqual({ solde: 23, joursAcquis: 25, joursPris: 2, joursEnAttente: 1 })
})

test('cree une demande de conges', async () => {
  pool.query.mockResolvedValueOnce({ rows: [{ id: 4, statut: 'en_attente' }] })
  const response = await request(app).post('/conges/demande').send({ employeeId: 12, dateDebut: '2026-09-01', dateFin: '2026-09-03', motif: 'Repos' }).expect(200)
  expect(response.body).toEqual({ id: 4, statut: 'en_attente' })
  expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO conges'), [12, '2026-09-01', '2026-09-03', 2, 'Repos', 'en_attente'])
})

test('retourne les donnees du endpoint debug pour audit de securite', async () => {
  pool.query.mockResolvedValueOnce({ rows: [{ id: 4, employee_id: 12 }] })
  const response = await request(app).get('/conges/debug/all').expect(200)
  expect(response.body).toEqual([{ id: 4, employee_id: 12 }])
})
