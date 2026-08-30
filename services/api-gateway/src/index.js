const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const { setupObservability } = require('./observability')
const app = express()
const { middleware: metricsMiddleware, metricsHandler } = setupObservability('gateway')

// CORS ouvert pour le dev — à restreindre en prod (TODO)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Access-Control-Allow-Headers', '*')
  next()
})

app.use(metricsMiddleware)

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001'
const PAIE_SERVICE_URL = process.env.PAIE_SERVICE_URL || 'http://localhost:3002'
const CONGES_SERVICE_URL = process.env.CONGES_SERVICE_URL || 'http://localhost:3003'
const RECRUTEMENT_SERVICE_URL = process.env.RECRUTEMENT_SERVICE_URL || 'http://localhost:3004'

// Les services backend exposent leurs routes sans prefixe /api (ex: /auth/login),
// pathRewrite retire le /api ajoute par le Gateway avant de proxyfier.
const stripApiPrefix = { '^/api': '' }

app.use('/api/auth', createProxyMiddleware({ target: AUTH_SERVICE_URL, changeOrigin: true, pathRewrite: stripApiPrefix }))
app.use('/api/paie', createProxyMiddleware({ target: PAIE_SERVICE_URL, changeOrigin: true, pathRewrite: stripApiPrefix }))
app.use('/api/conges', createProxyMiddleware({ target: CONGES_SERVICE_URL, changeOrigin: true, pathRewrite: stripApiPrefix }))
app.use('/api/recrutement', createProxyMiddleware({ target: RECRUTEMENT_SERVICE_URL, changeOrigin: true, pathRewrite: stripApiPrefix }))

app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.get('/metrics', metricsHandler)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message, stack: err.stack })
})

if (require.main === module) {
  app.listen(3000, () => {
    console.log('API Gateway running on :3000')
  })
}

module.exports = app
