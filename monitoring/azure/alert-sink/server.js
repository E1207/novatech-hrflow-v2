const express = require('express')
const app = express()

app.use(express.json({ limit: '256kb' }))

app.post('/alert', (req, res) => {
  console.log('[ALERT]', JSON.stringify(req.body))
  res.json({ received: true })
})

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.listen(8080, () => console.log('HRFlow alert sink running on :8080'))
