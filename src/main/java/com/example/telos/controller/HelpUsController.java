package com.example.telos.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/helpus")
public class HelpUsController {
    @RequestMapping
    public String helpUs() {
        return "helpus";
    }
}
