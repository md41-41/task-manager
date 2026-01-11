CREATE TABLE lists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  list_id INTEGER REFERENCES lists(id),
  status VARCHAR(50) DEFAULT 'not-started',
  priority VARCHAR(50) DEFAULT 'Tier 2',
  timeframe VARCHAR(50) DEFAULT 'today',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO lists (name) VALUES ('Personal'), ('Business'), ('Projects'), ('Ideas');

CREATE INDEX idx_tasks_list_id ON tasks(list_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_notes_task_id ON notes(task_id);
