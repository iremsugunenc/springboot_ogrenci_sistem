
package com.example.ogrenci_yonetim_sistemi;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
public class OgrenciController {

    private final OgrenciService ogrenciService;

    public OgrenciController(OgrenciService ogrenciService) {
        this.ogrenciService = ogrenciService;
    }

    @GetMapping("/ogrenciler")
    public List<Ogrenci> ogrencileriGetir() {
        return ogrenciService.tumOgrencileriGetir();
    }

    @PostMapping("/ogrenciler")
    public Ogrenci ogrenciEkle(@RequestBody Ogrenci ogrenci) {
        return ogrenciService.ogrenciKaydet(ogrenci);
    }

    @PutMapping("/ogrenciler/{id}")
    public Ogrenci ogrenciGuncelle(
            @PathVariable Long id,
            @RequestBody Ogrenci ogrenci) {

        return ogrenciService.ogrenciGuncelle(id, ogrenci);
    }

    @DeleteMapping("/ogrenciler/{id}")
    public void ogrenciSil(@PathVariable Long id) {
        ogrenciService.ogrenciSil(id);
    }
}
