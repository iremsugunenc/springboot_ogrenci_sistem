package com.example.ogrenci_yonetim_sistemi;

import org.springframework.stereotype.Component;

@Component
public class DenemeBean {

    public String mesaj() {
        return "Bu yeni bir Spring Bean nesnesidir.";
    }
}
