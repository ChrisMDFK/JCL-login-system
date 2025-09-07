import { Router } from 'express';

const router = Router();

/**
 * Prometheus 指標端點
 */
router.get('/metrics', async (req, res) => {
  // 這裡可以整合 prom-client 來提供 Prometheus 指標
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP jcl_auth_requests_total Total number of requests
# TYPE jcl_auth_requests_total counter
jcl_auth_requests_total 0

# HELP jcl_auth_active_sessions Active user sessions
# TYPE jcl_auth_active_sessions gauge
jcl_auth_active_sessions 0
  `);
});

export { router as metricsRoutes };