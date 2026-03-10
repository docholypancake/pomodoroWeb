package com.example.telos.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/about")
public class AboutUsController {
    @RequestMapping
    public String aboutUs() {
        return "about";
    }
}
