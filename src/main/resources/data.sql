INSERT INTO users (username, email, password)
VALUES
    ('user', 'user@test.com', '1111'),
    ('guest', 'guest@test.com', '2222'),
    ('demo', 'demo@test.com', '3333');


INSERT INTO user_time_settings
(user_id, pomodoro_minutes, short_break_minutes, long_break_minutes, pomo_cycles, sounds_enable)
VALUES
    (1, 25, 5, 15, 4, true),
    (2, 30, 5, 20, 4, true),
    (3, 50, 10, 30, 3, false);