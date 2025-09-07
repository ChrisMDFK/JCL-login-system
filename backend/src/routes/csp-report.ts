import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

/**
 * CSP 違規報告端點
 */
router.post('/csp-report', (req, res) => {
  const report = req.body;
  
  logger.warn('CSP 違規報告', {
    report,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(204).send();
});

export { router as cspReportRoutes };