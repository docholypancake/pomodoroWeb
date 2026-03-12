DROP TABLE IF EXISTS user_time_settings;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

 CREATE TABLE user_time_settings (
    settings_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL,
    pomodoro_minutes INT NOT NULL,
    short_break_minutes INT NOT NULL,
    long_break_minutes INT NOT NULL,
    pomo_cycles INT NOT NULL,
    sounds_enable BOOLEAN NOT NULL,

    CONSTRAINT user_id_fk FOREIGN KEY (user_id) REFERENCES users (user_id)
);