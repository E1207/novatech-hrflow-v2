const client = require('prom-client')

function setupObservability(serviceName) {
  const register = new client.Registry()
  client.collectDefaultMetrics({ register })

  const requestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['service', 'method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [register],
  })

  const requestCount = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['service', 'method', 'route', 'status_code'],
    registers: [register],
  })

  const requestErrors = new client.Counter({
    name: 'http_request_errors_total',
    help: 'Total number of HTTP 5xx responses',
    labelNames: ['service', 'method', 'route', 'status_code'],
    registers: [register],
  })

  const middleware = (req, res, next) => {
    const start = process.hrtime.bigint()
    res.on('finish', () => {
      const route = req.route?.path || req.path || req.originalUrl || 'unknown'
      const labels = { service: serviceName, method: req.method, route, status_code: String(res.statusCode) }
      const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9
      requestCount.inc(labels)
      requestDuration.observe(labels, durationSeconds)
      if (res.statusCode >= 500) requestErrors.inc(labels)
    })
    next()
  }

  const metricsHandler = async (req, res) => {
    res.set('Content-Type', register.contentType)
    res.end(await register.metrics())
  }

  return { middleware, metricsHandler }
}

module.exports = { setupObservability }
