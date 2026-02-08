export const MATCH_SCORE_THRESHOLD = Number(process.env.MATCH_SCORE_THRESHOLD || '50');
const EXPIRATION_DAYS = Number(process.env.MATCH_REQUEST_EXPIRATION_DAYS || '3');
export const MATCH_REQUEST_EXPIRATION_MS = 1000 * 60 * 60 * 24 * EXPIRATION_DAYS;
export const MATCH_BASE_LIMIT = Number(process.env.MATCH_BASE_LIMIT || '5');
export const MATCH_LIMIT_INCREMENT = Number(process.env.MATCH_LIMIT_INCREMENT || '5');
export const MATCH_LIMIT_PRICE_XAF = Number(process.env.MATCH_LIMIT_PRICE_XAF || '6000');
export const MATCH_UNLOCK_PRICE_XAF = Number(process.env.MATCH_UNLOCK_PRICE_XAF || '500');

export function resolveMatchLimit(limit?: number): number {
  return Number.isFinite(limit) && limit ? limit : MATCH_BASE_LIMIT;
}
