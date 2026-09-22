'use strict';

// Common personal ("freemailer") email domains. Used to flag calculator
// leads and waitlist signups as "company_verified: false" — they're still
// accepted (per spec), just marked for sales to treat differently.
// Static list, not a paid lookup service — update here if a common one is missing.
const FREEMAILER_DOMAINS = new Set([
  // Global majors
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.de',
  'outlook.com', 'outlook.de', 'hotmail.com', 'hotmail.de', 'hotmail.co.uk',
  'live.com', 'live.de', 'msn.com', 'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'protonmail.com', 'proton.me', 'pm.me',
  // DACH-specific
  'web.de', 'gmx.de', 'gmx.net', 'gmx.at', 'gmx.ch', 't-online.de', 'freenet.de',
  'arcor.de', 'mailbox.org', 'posteo.de', 'yahoo.at', 'bluewin.ch', 'hispeed.ch',
  // UK/EU
  'btinternet.com', 'virginmedia.com', 'sky.com', 'talktalk.net', 'orange.fr',
  'free.fr', 'laposte.net', 'wanadoo.fr', 'libero.it', 'virgilio.it', 'tiscali.it',
  'seznam.cz', 'wp.pl', 'onet.pl', 'interia.pl',
  // Other common
  'yandex.com', 'yandex.ru', 'mail.ru', 'qq.com', '163.com', '126.com',
  'rediffmail.com', 'zoho.com', 'fastmail.com',
]);

/** @param {string} email @returns {boolean} true if the domain is a personal/freemailer address */
function isFreemailer(email) {
  const domain = (email || '').toLowerCase().split('@')[1];
  return !!domain && FREEMAILER_DOMAINS.has(domain);
}

module.exports = { isFreemailer, FREEMAILER_DOMAINS };
