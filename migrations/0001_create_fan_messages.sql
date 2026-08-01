-- Fan messages table for Idea Lamp Ilyes
CREATE TABLE IF NOT EXISTS fan_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  email      TEXT,
  message    TEXT    NOT NULL,
  created_at TEXT    DEFAULT (datetime('now')),
  is_read    INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_fan_messages_created_at ON fan_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fan_messages_is_read    ON fan_messages(is_read);
