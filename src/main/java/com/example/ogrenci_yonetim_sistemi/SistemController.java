package com.example.ogrenci_yonetim_sistemi;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/sistem")
public class SistemController {

    private final SpringBeanBilgisi springBeanBilgisi;

    public SistemController(SpringBeanBilgisi springBeanBilgisi) {
        this.springBeanBilgisi = springBeanBilgisi;
    }

    @GetMapping("/bean-sayisi")
    public Map<String, Integer> beanSayisi() {
        return Map.of(
            "beanSayisi",
            springBeanBilgisi.beanSayisiniGetir()
        );
    }
}