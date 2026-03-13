package com.example.telos.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserTimeSettingsDto {
    private int pomodoroMinutes;
    private int shortBreakMinutes;
    private int longBreakMinutes;
    private int pomoCycles;
    private boolean soundsEnabled;
}
