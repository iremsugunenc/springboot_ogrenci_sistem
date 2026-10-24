package com.example.ogrenci_yonetim_sistemi;

import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class SpringBeanBilgisi {

    private final ApplicationContext applicationContext;

    public SpringBeanBilgisi(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    public int beanSayisiniGetir() {
        return applicationContext.getBeanDefinitionCount();
    }
}

