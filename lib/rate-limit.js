'use strict';

// Simple in-memory sliding-window rate limiter, same pattern as the existing
// login rate limit in server.js. Good enough for a single-instance deploy;
// if this ever runs on multiple instances, move to a shared store (Redis).
const _attempts = new Map(); // key -> [timestamps]

/**
 * @param {string} key   usually `${routeName}:${ip}`
 * @param {number} max   max attempts allowed within windowMs
 * @param {number} windowMs
 * @returns {{blocked: boolean}}
 */
function checkRateLimit(key, max, windowMs) {
  const now = Date.now();
  const prev = (_attempts.get(key) || []).filter(t => now - t < windowMs);
  if (prev.length >= max) {
    _attempts.set(key, prev);
    return { blocked: true };
  }
  prev.push(now);
  _attempts.set(key, prev);
  return { blocked: false };
}

module.exports = { checkRateLimit };
