CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    account VARCHAR(100),
    autopay BOOLEAN DEFAULT FALSE,
    interval_value INTEGER DEFAULT 1,
    interval_unit VARCHAR(20) CHECK (interval_unit IN ('days', 'weeks', 'months', 'years')),
    notify BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS ntfy_settings (
    id SERIAL PRIMARY KEY,
    topic VARCHAR(255) NOT NULL
);