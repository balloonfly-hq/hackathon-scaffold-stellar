import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Validates that the request has a valid Authorization header matching Bearer ${process.env.CRON_SECRET}.
 * Returns true if authorized, false otherwise (and sends a 401 Unauthorized response).
 */
export function verifyCronSecret(req: VercelRequest, res: VercelResponse): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
    res.status(401).json({
      error: 'Unauthorized: Invalid or missing CRON_SECRET authorization header',
    });
    return false;
  }

  return true;
}
