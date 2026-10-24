
package com.example.ogrenci_yonetim_sistemi;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class OgrenciService {

    private final OgrenciRepository ogrenciRepository;

    public OgrenciService(OgrenciRepository ogrenciRepository) {
        this.ogrenciRepository = ogrenciRepository;
    }

    // Bütün öğrencileri getir
    public List<Ogrenci> tumOgrencileriGetir() {
        return ogrenciRepository.findAll();
    }

    // Yeni öğrenci ekle
    public Ogrenci ogrenciKaydet(Ogrenci ogrenci) {
        return ogrenciRepository.save(ogrenci);
    }

    // Öğrenci bilgilerini güncelle
    public Ogrenci ogrenciGuncelle(Long id, Ogrenci yeniBilgiler) {

        Ogrenci ogrenci = ogrenciRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Öğrenci bulunamadı: " + id));

        ogrenci.setAd(yeniBilgiler.getAd());
        ogrenci.setSoyad(yeniBilgiler.getSoyad());
        ogrenci.setBolum(yeniBilgiler.getBolum());

        return ogrenciRepository.save(ogrenci);
    }

    // Öğrenciyi sil
    public void ogrenciSil(Long id) {

        if (!ogrenciRepository.existsById(id)) {
            throw new RuntimeException("Öğrenci bulunamadı: " + id);
        }

        ogrenciRepository.deleteById(id);
    }
}
