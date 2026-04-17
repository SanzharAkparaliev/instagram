-- Instagram CRM — Database инициализация
-- psql -U postgres -d instagram_crm -f init.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  UNIQUE NOT NULL,
  password    VARCHAR(255)  NOT NULL,
  role        VARCHAR(20)   NOT NULL DEFAULT 'manager'
                            CHECK (role IN ('admin','manager')),
  "createdAt" TIMESTAMP     NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Target accounts
CREATE TABLE IF NOT EXISTS target_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    VARCHAR(100)  NOT NULL,
  url         VARCHAR(255),
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP     NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Parser accounts
CREATE TABLE IF NOT EXISTS parser_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login       VARCHAR(150)  NOT NULL,
  password    TEXT          NOT NULL,
  proxy       VARCHAR(255),
  status      VARCHAR(20)   NOT NULL DEFAULT 'idle'
                            CHECK (status IN ('idle','parsing','banned','error')),
  last_used   TIMESTAMP,
  "createdAt" TIMESTAMP     NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id          VARCHAR(50)   PRIMARY KEY,
  target_id   UUID          REFERENCES target_accounts(id) ON DELETE SET NULL,
  text        TEXT,
  url         VARCHAR(255),
  posted_at   TIMESTAMP,
  parsed_at   TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id           VARCHAR(50)  PRIMARY KEY,
  post_id      VARCHAR(50)  REFERENCES posts(id) ON DELETE CASCADE,
  username     VARCHAR(100),
  text         TEXT,
  is_lead      BOOLEAN      NOT NULL DEFAULT false,
  lead_reason  VARCHAR(20)  CHECK (lead_reason IN ('keyword','no_reply')),
  is_processed BOOLEAN      NOT NULL DEFAULT false,
  processed_by UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP,
  parsed_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_is_lead      ON comments(is_lead);
CREATE INDEX IF NOT EXISTS idx_comments_is_processed ON comments(is_processed);
CREATE INDEX IF NOT EXISTS idx_comments_post_id      ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_username     ON comments(username);
CREATE INDEX IF NOT EXISTS idx_posts_target_id       ON posts(target_id);
CREATE INDEX IF NOT EXISTS idx_posts_parsed_at       ON posts(parsed_at DESC);

-- Logs (optional)
CREATE TABLE IF NOT EXISTS parser_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID REFERENCES parser_accounts(id) ON DELETE SET NULL,
  target_id    UUID REFERENCES target_accounts(id) ON DELETE SET NULL,
  status       VARCHAR(20),
  message      TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Default admin user (password: admin123)
INSERT INTO users (name, email, password, role)
VALUES (
  'Admin',
  'admin@crm.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/7ZuZiWi',
  'admin'
) ON CONFLICT (email) DO NOTHING;

\echo '✅ Database инициализацияланды'
