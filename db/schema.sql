-- ============================================================================
-- HansePay MySQL schema — migration from JSON file storage.
-- Charset utf8mb4 throughout (German umlauts, currency symbols). InnoDB for
-- FK + transaction support. Idempotent: safe to re-run (CREATE TABLE IF NOT
-- EXISTS) against a partially-applied database.
-- ============================================================================

SET NAMES utf8mb4;

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id              VARCHAR(64)   NOT NULL PRIMARY KEY,
  name            VARCHAR(255)  NOT NULL DEFAULT '',
  email           VARCHAR(255)  NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL DEFAULT '',
  role            ENUM('admin','editor','user','compliance') NOT NULL DEFAULT 'user',
  avatar          VARCHAR(512)  NOT NULL DEFAULT '',
  bio             TEXT          NULL,
  avatar_url      VARCHAR(512)  NULL,
  linkedin        VARCHAR(512)  NULL,
  ai_model        VARCHAR(128)  NULL,
  ai_system_prompt TEXT         NULL,
  claude_api_key  VARCHAR(255)  NULL,
  pricing         JSON          NULL,
  created_at      DATETIME(3)   NOT NULL,
  last_login      DATETIME(3)   NULL,
  updated_at      DATETIME(3)   NULL,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. customers
CREATE TABLE IF NOT EXISTS customers (
  id                VARCHAR(32)   NOT NULL PRIMARY KEY,
  first_name        VARCHAR(128)  NOT NULL DEFAULT '',
  last_name         VARCHAR(128)  NOT NULL DEFAULT '',
  email             VARCHAR(255)  NOT NULL DEFAULT '',
  phone             VARCHAR(64)   NOT NULL DEFAULT '',
  website           VARCHAR(255)  NOT NULL DEFAULT '',
  company           VARCHAR(255)  NOT NULL DEFAULT '',
  industry          VARCHAR(128)  NOT NULL DEFAULT '',
  company_size      VARCHAR(64)   NOT NULL DEFAULT '',
  country           VARCHAR(128)  NOT NULL DEFAULT '',
  city              VARCHAR(128)  NOT NULL DEFAULT '',
  fx_volume         VARCHAR(128)  NOT NULL DEFAULT '',
  currency_pairs    VARCHAR(255)  NOT NULL DEFAULT '',
  stage             ENUM('lead','qualified','proposal','won','lost') NOT NULL DEFAULT 'lead',
  status            ENUM('prospect','active','churned') NOT NULL DEFAULT 'prospect',
  owner             VARCHAR(255)  NOT NULL DEFAULT '',
  source            VARCHAR(32)   NOT NULL DEFAULT 'manual',
  tags              JSON          NULL,
  notes             TEXT          NULL,
  est_value_eur     DECIMAL(14,2) NOT NULL DEFAULT 0,
  booking_ids       JSON          NULL,
  last_contact_at   DATETIME(3)   NULL,
  next_follow_up_at DATETIME(3)   NULL,
  lang              VARCHAR(8)    NOT NULL DEFAULT 'de',
  created_at        DATETIME(3)   NOT NULL,
  updated_at        DATETIME(3)   NOT NULL,
  KEY idx_customers_stage (stage),
  KEY idx_customers_status (status),
  KEY idx_customers_source (source),
  KEY idx_customers_owner (owner),
  KEY idx_customers_country (country),
  KEY idx_customers_email (email),
  KEY idx_customers_created_at (created_at),
  KEY idx_customers_updated_at (updated_at),
  FULLTEXT KEY ft_customers_search (company, first_name, last_name, email, industry, city, country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. activities
CREATE TABLE IF NOT EXISTS activities (
  id           VARCHAR(32)  NOT NULL PRIMARY KEY,
  customer_id  VARCHAR(32)  NOT NULL,
  type         ENUM('booking','meeting','stage_change','call','email','note') NOT NULL DEFAULT 'note',
  title        VARCHAR(500) NOT NULL DEFAULT '',
  body         TEXT         NULL,
  by_name      VARCHAR(255) NOT NULL DEFAULT 'system',
  at           DATETIME(3)  NOT NULL,
  KEY idx_activities_customer_at (customer_id, at DESC),
  CONSTRAINT fk_activities_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. bookings
CREATE TABLE IF NOT EXISTS bookings (
  id                 VARCHAR(128)  NOT NULL PRIMARY KEY,
  customer_id        VARCHAR(32)   NULL,
  created_at         DATETIME(3)   NOT NULL,
  slot               JSON          NOT NULL,
  slot_start         DATETIME(3)   GENERATED ALWAYS AS (STR_TO_DATE(JSON_UNQUOTE(JSON_EXTRACT(slot, '$.startISO')), '%Y-%m-%dT%H:%i:%s.%fZ')) VIRTUAL,
  `lead`             JSON          NOT NULL,
  lead_email         VARCHAR(255)  GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(`lead`, '$.email'))) VIRTUAL,
  status             ENUM('new','cancelled','won') NOT NULL DEFAULT 'new',
  notes              TEXT          NULL,
  meet_link          VARCHAR(512)  NULL,
  event_id           VARCHAR(255)  NULL,
  rebook_token       CHAR(32)      NULL,
  cancel_token       CHAR(32)      NULL,
  assigned_to        JSON          NULL,
  rebooked           TINYINT(1)    NOT NULL DEFAULT 0,
  rebooked_at        DATETIME(3)   NULL,
  updated_at         DATETIME(3)   NULL,
  cancelled_at       DATETIME(3)   NULL,
  cancelled_by       VARCHAR(32)   NULL,
  cancelled_by_name  VARCHAR(255)  NULL,
  KEY idx_bookings_created_at (created_at),
  KEY idx_bookings_status (status),
  KEY idx_bookings_slot_start (slot_start),
  KEY idx_bookings_rebook_token (rebook_token),
  KEY idx_bookings_cancel_token (cancel_token),
  KEY idx_bookings_customer (customer_id),
  KEY idx_bookings_lead_email (lead_email),
  CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. registrations
CREATE TABLE IF NOT EXISTS registrations (
  id                 VARCHAR(64)   NOT NULL PRIMARY KEY,
  email              VARCHAR(255)  NOT NULL,
  first_name         VARCHAR(128)  NOT NULL DEFAULT '',
  last_name          VARCHAR(128)  NOT NULL DEFAULT '',
  status             ENUM('started','review','approved') NOT NULL DEFAULT 'started',
  application_ref    VARCHAR(64)   NULL,
  started_at         DATETIME(3)   NULL,
  company            VARCHAR(255)  NOT NULL DEFAULT '',
  account_type       ENUM('business','individual','company') NOT NULL DEFAULT 'business',
  phone              VARCHAR(64)   NOT NULL DEFAULT '',
  country            VARCHAR(128)  NOT NULL DEFAULT '',
  city               VARCHAR(128)  NOT NULL DEFAULT '',
  reg_num            VARCHAR(128)  NOT NULL DEFAULT '',
  vat                VARCHAR(64)   NOT NULL DEFAULT '',
  submitted_at       DATETIME(3)   NULL,
  lang               VARCHAR(8)    NOT NULL DEFAULT 'en',
  approved_at        DATETIME(3)   NULL,
  restored_by_admin  TINYINT(1)    NOT NULL DEFAULT 0,
  KEY idx_registrations_email (email),
  KEY idx_registrations_application_ref (application_ref),
  KEY idx_registrations_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. transactions (new surrogate PK — no existing external ID to preserve)
CREATE TABLE IF NOT EXISTS transactions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_email      VARCHAR(255)    NOT NULL,
  amount          DECIMAL(18,2)   NULL,
  currency        VARCHAR(8)      NULL,
  send_amount     DECIMAL(18,2)   NULL,
  send_currency   VARCHAR(8)      NULL,
  recipient_name  VARCHAR(255)    NULL,
  recipient       VARCHAR(255)    NULL,
  extra           JSON            NULL,
  saved_at        DATETIME(3)     NOT NULL,
  KEY idx_transactions_user_email (user_email),
  KEY idx_transactions_saved_at (saved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. posts
CREATE TABLE IF NOT EXISTS posts (
  id                VARCHAR(32)   NOT NULL PRIMARY KEY,
  slug              VARCHAR(255)  NOT NULL,
  title             VARCHAR(500)  NOT NULL,
  excerpt           TEXT          NULL,
  content           LONGTEXT      NULL,
  category          VARCHAR(128)  NOT NULL DEFAULT 'Uncategorised',
  tags              JSON          NULL,
  status            VARCHAR(32)   NOT NULL DEFAULT 'draft',
  featured          TINYINT(1)    NOT NULL DEFAULT 0,
  featured_image    VARCHAR(512)  NULL,
  read_time         VARCHAR(32)   NULL,
  author_id         VARCHAR(64)   NULL,
  author_name       VARCHAR(255)  NULL,
  author_role       VARCHAR(64)   NULL,
  author_bio        TEXT          NULL,
  author_avatar     VARCHAR(512)  NULL,
  author_linkedin   VARCHAR(512)  NULL,
  created_at        DATETIME(3)   NOT NULL,
  published_at      DATETIME(3)   NULL,
  updated_at        DATETIME(3)   NULL,
  views             INT UNSIGNED  NOT NULL DEFAULT 0,
  show_in_listing   TINYINT(1)    NOT NULL DEFAULT 1,
  UNIQUE KEY uq_posts_slug (slug),
  KEY idx_posts_status_created (status, created_at),
  KEY idx_posts_category (category),
  KEY idx_posts_views (views),
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. legal_documents
CREATE TABLE IF NOT EXISTS legal_documents (
  slug            VARCHAR(64)   NOT NULL PRIMARY KEY,
  title           VARCHAR(255)  NOT NULL DEFAULT '',
  badge           VARCHAR(128)  NULL,
  body            LONGTEXT      NULL,
  effective_line  VARCHAR(255)  NULL,
  updated_at      DATETIME(3)   NULL,
  updated_by      VARCHAR(255)  NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. app_settings (single-row singleton)
CREATE TABLE IF NOT EXISTS app_settings (
  id                  TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
  site_name           VARCHAR(255) NOT NULL DEFAULT '',
  site_url            VARCHAR(255) NOT NULL DEFAULT '',
  blog_title          VARCHAR(255) NOT NULL DEFAULT '',
  blog_description    TEXT         NULL,
  contact_email       VARCHAR(255) NOT NULL DEFAULT '',
  default_author      VARCHAR(255) NOT NULL DEFAULT '',
  posts_per_page      INT UNSIGNED NOT NULL DEFAULT 9,
  coming_soon_mode    TINYINT(1)   NOT NULL DEFAULT 0,
  maintenance_mode    TINYINT(1)   NOT NULL DEFAULT 0,
  google_analytics_id VARCHAR(64)  NULL,
  sales_reps          JSON         NULL,
  CONSTRAINT chk_app_settings_singleton CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. page_seo
CREATE TABLE IF NOT EXISTS page_seo (
  slug            VARCHAR(64)   NOT NULL PRIMARY KEY,
  title           VARCHAR(255)  NULL,
  meta_title      VARCHAR(255)  NULL,
  description     TEXT          NULL,
  meta_description TEXT         NULL,
  keywords        JSON          NULL,
  og_image        VARCHAR(512)  NULL,
  updated_at      DATETIME(3)   NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. currencies
CREATE TABLE IF NOT EXISTS currencies (
  code      CHAR(3)       NOT NULL PRIMARY KEY,
  name      VARCHAR(128)  NOT NULL,
  symbol    VARCHAR(8)    NULL,
  country   VARCHAR(128)  NULL,
  flat_fee  DECIMAL(10,4) NOT NULL DEFAULT 0,
  var_fee   DECIMAL(10,4) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. social_posts
CREATE TABLE IF NOT EXISTS social_posts (
  id                VARCHAR(32)  NOT NULL PRIMARY KEY,
  title             VARCHAR(255) NOT NULL DEFAULT '',
  caption           TEXT         NULL,
  hashtags          TEXT         NULL,
  image             VARCHAR(512) NULL,
  channels          JSON         NULL,
  channel_captions  JSON         NULL,
  status            ENUM('draft','scheduled','posted') NOT NULL DEFAULT 'draft',
  scheduled_at      DATETIME(3)  NULL,
  posted_at         DATETIME(3)  NULL,
  created_by        VARCHAR(255) NULL,
  created_at        DATETIME(3)  NOT NULL,
  updated_at        DATETIME(3)  NULL,
  KEY idx_social_status (status),
  KEY idx_social_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. analytics_events (append-only)
CREATE TABLE IF NOT EXISTS analytics_events (
  id          VARCHAR(36)   NOT NULL PRIMARY KEY,
  type        VARCHAR(64)   NOT NULL DEFAULT 'pageview',
  page        VARCHAR(512)  NOT NULL DEFAULT '/',
  referrer    VARCHAR(512)  NULL,
  data        JSON          NULL,
  ts          DATETIME(3)   NOT NULL,
  KEY idx_analytics_type (type),
  KEY idx_analytics_ts (ts),
  KEY idx_analytics_page (page(191)),
  KEY idx_analytics_type_ts (type, ts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. email_settings (single-row singleton)
CREATE TABLE IF NOT EXISTS email_settings (
  id                 TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
  footer_tagline     VARCHAR(255) NULL,
  from_display_name  VARCHAR(255) NULL,
  default_lang       VARCHAR(8)   NULL,
  updated_at         DATETIME(3)  NULL,
  CONSTRAINT chk_email_settings_singleton CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. email_templates
CREATE TABLE IF NOT EXISTS email_templates (
  id              VARCHAR(64)  NOT NULL PRIMARY KEY,
  subject         VARCHAR(500) NULL,
  blocks          JSON         NULL,
  footer_tagline  VARCHAR(255) NULL,
  created_at      DATETIME(3)  NOT NULL,
  updated_at      DATETIME(3)  NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
