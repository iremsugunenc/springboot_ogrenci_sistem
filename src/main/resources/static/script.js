
const API_URL = "/ogrenciler";

let ogrenciListesi = [];

// 1. Öğrencileri getir
async function ogrencileriGetir() {
    const tablo = document.getElementById("ogrenciTablosu");

    try {
        const cevap = await fetch(API_URL);

        if (!cevap.ok) {
            throw new Error("Öğrenciler alınamadı.");
        }

        ogrenciListesi = await cevap.json();

        ogrencileriFiltrele();
        istatistikleriGuncelle();

    } catch (hata) {
        console.error("Öğrenci yükleme hatası:", hata);

        tablo.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    Öğrenciler yüklenemedi. Sunucuyu kontrol et.
                </td>
            </tr>
        `;
    }
}

// 2. Öğrencileri ara ve filtrele
function ogrencileriFiltrele() {
    const arama = document
        .getElementById("arama")
        .value
        .toLocaleLowerCase("tr-TR")
        .trim();

    const filtrelenmis = ogrenciListesi.filter(ogrenci => {
        const adSoyad =
            `${ogrenci.ad || ""} ${ogrenci.soyad || ""}`
                .toLocaleLowerCase("tr-TR");

        const bolum = (ogrenci.bolum || "")
            .toLocaleLowerCase("tr-TR");

        return adSoyad.includes(arama) ||
               bolum.includes(arama);
    });

    const tablo = document.getElementById("ogrenciTablosu");

    if (filtrelenmis.length === 0) {
        tablo.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    Öğrenci bulunamadı.
                </td>
            </tr>
        `;
        return;
    }

    tablo.innerHTML = filtrelenmis.map(ogrenci => `
        <tr>
            <td>${guvenliMetin(ogrenci.id)}</td>
            <td>${guvenliMetin(ogrenci.ad)}</td>
            <td>${guvenliMetin(ogrenci.soyad)}</td>
            <td>${guvenliMetin(ogrenci.bolum)}</td>
            <td class="actions">
                <button
                    type="button"
                    class="edit-button"
                    onclick="ogrenciDuzenle(${Number(ogrenci.id)})">
                    Düzenle
                </button>

                <button
                    type="button"
                    class="delete-button"
                    onclick="ogrenciSil(${Number(ogrenci.id)})">
                    Sil
                </button>
            </td>
        </tr>
    `).join("");
}

// 3. Metinleri güvenli şekilde göster
function guvenliMetin(metin) {
    const eleman = document.createElement("span");
    eleman.textContent = metin ?? "";
    return eleman.innerHTML;
}

// 4. İstatistikleri güncelle
function istatistikleriGuncelle() {
    document.getElementById("toplamOgrenci").textContent =
        ogrenciListesi.length;

    const bolumler = new Set(
        ogrenciListesi
            .map(ogrenci => (ogrenci.bolum || "").trim())
            .filter(bolum => bolum.length > 0)
            .map(bolum => bolum.toLocaleLowerCase("tr-TR"))
    );

    document.getElementById("toplamBolum").textContent =
        bolumler.size;
}

// 5. Yeni öğrenci formunu aç
function formuAc() {
    document.getElementById("ogrenciFormu").reset();
    document.getElementById("ogrenciId").value = "";

    document.getElementById("formBasligi").textContent =
        "Yeni Öğrenci Ekle";

    document.getElementById("ogrenciModal").style.display = "flex";
}

// 6. Formu kapat
function formuKapat() {
    document.getElementById("ogrenciModal").style.display = "none";
}

// 7. Bildirim göster
function bildirimGoster(mesaj, hata = false) {
    const bildirim = document.getElementById("bildirim");

    bildirim.textContent = mesaj;
    bildirim.classList.toggle("error", hata);
    bildirim.style.display = "block";

    setTimeout(() => {
        bildirim.style.display = "none";
    }, 3000);
}

// 8. Öğrenciyi düzenleme formuna getir
function ogrenciDuzenle(id) {
    const ogrenci = ogrenciListesi.find(
        ogrenci => Number(ogrenci.id) === Number(id)
    );

    if (!ogrenci) {
        bildirimGoster("Öğrenci bulunamadı.", true);
        return;
    }

    document.getElementById("ogrenciId").value = ogrenci.id;
    document.getElementById("ad").value = ogrenci.ad || "";
    document.getElementById("soyad").value = ogrenci.soyad || "";
    document.getElementById("bolum").value = ogrenci.bolum || "";

    document.getElementById("formBasligi").textContent =
        "Öğrenci Düzenle";

    document.getElementById("ogrenciModal").style.display = "flex";
}

// 9. Öğrenci ekle veya güncelle
document.getElementById("ogrenciFormu").addEventListener(
    "submit",
    async function(event) {
        event.preventDefault();

        const id = document.getElementById("ogrenciId").value;

        const ogrenci = {
            ad: document.getElementById("ad").value.trim(),
            soyad: document.getElementById("soyad").value.trim(),
            bolum: document.getElementById("bolum").value.trim()
        };

        if (!ogrenci.ad || !ogrenci.soyad || !ogrenci.bolum) {
            bildirimGoster("Lütfen bütün alanları doldur.", true);
            return;
        }

        try {
            const cevap = await fetch(
                id ? `${API_URL}/${id}` : API_URL,
                {
                    method: id ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(ogrenci)
                }
            );

            if (!cevap.ok) {
                throw new Error("İşlem başarısız.");
            }

            this.reset();
            document.getElementById("ogrenciId").value = "";

            formuKapat();
            document.getElementById("arama").value = "";

            await ogrencileriGetir();

            document.getElementById("formBasligi").textContent =
                "Yeni Öğrenci Ekle";

            bildirimGoster(
                id
                    ? "Öğrenci başarıyla güncellendi."
                    : "Öğrenci başarıyla eklendi."
            );

        } catch (hata) {
            console.error("Öğrenci kaydetme hatası:", hata);

            bildirimGoster(
                "İşlem başarısız. Backend ve veritabanını kontrol et.",
                true
            );
        }
    }
);

// 10. Öğrenciyi sil
async function ogrenciSil(id) {
    const onay = confirm("Bu öğrenciyi silmek istiyor musun?");

    if (!onay) {
        return;
    }

    try {
        const cevap = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!cevap.ok) {
            throw new Error("Silme işlemi başarısız.");
        }

        await ogrencileriGetir();

        bildirimGoster("Öğrenci başarıyla silindi.");

    } catch (hata) {
        console.error("Öğrenci silme hatası:", hata);

        bildirimGoster(
            "Öğrenci silinemedi. Backend'i kontrol et.",
            true
        );
    }
}

// 11. Modalın dışına tıklanınca formu kapat
document.getElementById("ogrenciModal").addEventListener(
    "click",
    function(event) {
        if (event.target === this) {
            formuKapat();
        }
    }
);

// 12. Spring Bean sayısını getir
async function beanSayisiniGetir() {
    const alan = document.getElementById("beanSayisi");

    try {
        const cevap = await fetch("/sistem/bean-sayisi");

        if (!cevap.ok) {
            throw new Error("Bean sayısı alınamadı.");
        }

        const veri = await cevap.json();

        alan.textContent = veri.beanSayisi;

    } catch (hata) {
        console.error("Bean sayısı hatası:", hata);
        alan.textContent = "Alınamadı";
    }
}

// 13. Spring Boot sistem durumunu kontrol et
async function sistemDurumunuGetir() {
    const durumAlani = document.getElementById("sistemDurumu");
    const detayAlani = document.getElementById("sistemDetayi");
    const nokta = document.getElementById("sistemDurumNoktasi");

    durumAlani.textContent = "Kontrol ediliyor...";
    detayAlani.textContent = "Sistem sağlık kontrolü yapılıyor.";

    nokta.classList.remove("online", "offline");

    try {
        const cevap = await fetch("/actuator/health");

        // DOWN yanıtında HTTP 503 gelse bile JSON durumunu okumayı dene.
        let veri;

        try {
            veri = await cevap.json();
        } catch {
            throw new Error("Sağlık bilgisi okunamadı.");
        }

        if (veri.status === "UP") {
            durumAlani.textContent = "Sistem çalışıyor";
            detayAlani.textContent = "Sistem sağlıklı.";
            nokta.classList.add("online");

        } else if (veri.status === "DOWN") {
            durumAlani.textContent = "Sistem çalışmıyor";
            detayAlani.textContent = "Sistemde bir sağlık sorunu var.";
            nokta.classList.add("offline");

        } else {
            durumAlani.textContent = "Sistem durumu bilinmiyor";
            detayAlani.textContent =
                "Durum: " + (veri.status || "Bilinmiyor");
            nokta.classList.add("offline");
        }

    } catch (hata) {
        console.error("Sistem durumu hatası:", hata);

        durumAlani.textContent = "Sisteme ulaşılamıyor";
        detayAlani.textContent =
            "Backend kapalı olabilir veya sağlık kontrolüne erişilemiyor.";

        nokta.classList.add("offline");
    }
}

// 14. Sayfa açıldığında fonksiyonları çalıştır
ogrencileriGetir();
beanSayisiniGetir();
sistemDurumunuGetir();
