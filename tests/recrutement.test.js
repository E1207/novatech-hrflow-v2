const request = require('supertest')

jest.mock('pg', () => ({ Pool: jest.fn(() => ({ query: jest.fn() })) }))

const { Pool } = require('pg')
const app = require('../services/recrutement/src/index')
const pool = Pool.mock.results[0].value

beforeEach(() => pool.query.mockReset())

test('liste les candidatures par date decroissante', async () => {
  pool.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'candidate@example.com' }] })
  const response = await request(app).get('/recrutement/candidats').expect(200)
  expect(response.body).toEqual([{ id: 1, email: 'candidate@example.com' }])
})

test('modifie le statut d une candidature', async () => {
  pool.query.mockResolvedValueOnce({ rows: [] })
  await request(app).patch('/recrutement/candidat/1/statut').send({ statut: 'accepte' }).expect(200)
  expect(pool.query).toHaveBeenCalledWith('UPDATE candidats SET statut = $1 WHERE id = $2', ['accepte', '1'])
})
