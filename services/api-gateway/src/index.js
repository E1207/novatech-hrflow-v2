const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')

const app = express()
app.use(express.json())

const safeTarget = (value, fallback) => {
  if (!value || value.includes('localhost') || value.includes('127.0.0.1')) {
    return fallback
  }
  return value
}

const AUTH_TARGET = safeTarget(process.env.AUTH_SERVICE_URL, 'http://localhost:3001')
const PAIE_TARGET = safeTarget(process.env.PAIE_SERVICE_URL, 'http://localhost:3002')
const CONGES_TARGET = safeTarget(process.env.CONGES_SERVICE_URL, 'http://localhost:3003')
const RECRUTEMENT_TARGET = safeTarget(process.env.RECRUTEMENT_SERVICE_URL, 'http://localhost:3004')

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Access-Control-Allow-Headers', '*')
  next()
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' })
})

const DEMO_USER = {
  id: 1,
  email: 'user@example.com',
  role: 'admin'
}

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}

  if (email === 'user@example.com' && password === 'password') {
    const token = Buffer.from(JSON.stringify({
      sub: DEMO_USER.id,
      email: DEMO_USER.email,
      role: DEMO_USER.role,
      exp: Math.floor(Date.now() / 1000) + 86400
    })).toString('base64')

    return res.json({
      token,
      user: DEMO_USER
    })
  }

  return res.status(401).json({ error: 'Invalid credentials' })
})

app.post('/api/auth/verify', (req, res) => {
  const { token } = req.body || {}

  if (!token) {
    return res.status(401).json({ valid: false })
  }

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'))
    return res.json({ valid: true, user: payload })
  } catch (error) {
    return res.status(401).json({ valid: false })
  }
})

app.use('/api/auth', createProxyMiddleware({ target: AUTH_TARGET, changeOrigin: true }))
app.use('/api/paie', createProxyMiddleware({ target: PAIE_TARGET, changeOrigin: true }))
app.use('/api/conges', createProxyMiddleware({ target: CONGES_TARGET, changeOrigin: true }))
app.use('/api/recrutement', createProxyMiddleware({ target: RECRUTEMENT_TARGET, changeOrigin: true }))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message, stack: err.stack })
})

if (require.main === module) {
  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`API Gateway running on :${port}`)
  })
}

module.exports = app
