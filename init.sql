CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    icon VARCHAR(50),
    recurrence VARCHAR(20) CHECK (recurrence IN ('weekly', 'monthly', 'yearly')),
    color VARCHAR(7)
);