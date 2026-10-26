const API_URL = "/ogrenciler";
const BEAN_URL = "/sistem/bean-sayisi";
const HEALTH_URL = "/actuator/health";

let ogrenciListesi = [];
let bolumGrafigi = null;
let bildirimZamanlayicisi = null;
let istekSuruyor = false;

const grafikRenkleri = [
    "#5969f5",
    "#8b5cf6",
    "#22b987",
    "#f4ad48",
    "#ec6b88",
    "#28a9d5",
    "#a3a0f5",
    "#ef8757",
    "#44b7a6",
    "#7c8ca5"
];

/* Sayfa başlangıcı */
document.addEventListener("DOMContentLoaded", () => {
    tarihiGoster();
    ogrencileriGetir();
    beanSayisiniGetir();
    sistemDurumunuGetir();

    document.getElementById("arama")
        .addEventListener("input", ogrencileriFiltrele);

    document.getElementById("ogrenciFormu")
        .addEventListener("submit", ogrenciKaydet);

    document.getElementById("ogrenciModal")
        .addEventListener("click", event => {
            if (event.target.id === "ogrenciModal") {
                formuKapat();
            }
        });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            formuKapat();
        }
    });

    document.querySelectorAll(".menu-item").forEach(item => {
        item.addEventListener("click", () => {
            document.querySelectorAll(".menu-item").forEach(menu => {
                menu.classList.remove("active");
            });

            item.classList.add("active");
        });
    });
});

/* Bugünün tarihini göster */
function tarihiGoster() {
    const alan = document.getElementById("bugununTarihi");

    alan.textContent = new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(new Date());
}

/* API yanıtını JSON olarak oku */
async function jsonOku(cevap) {
    if (!cevap.ok) {
        throw new Error("Sunucu isteği başarısız. HTTP " + cevap.status);
    }

    return cevap.json();
}

/* Öğrencileri backend'den getir */
async function ogrencileriGetir() {
    const tablo = document.getElementById("ogrenciTablosu");

    if (istekSuruyor) return;
    istekSuruyor = true;

    try {
        const cevap = await fetch(API_URL, {
            headers: {
                "Accept": "application/json"
            }
        });

        if (cevap.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        const veri = await jsonOku(cevap);

        if (!Array.isArray(veri)) {
            throw new Error("Sunucudan beklenen öğrenci listesi gelmedi.");
        }

        ogrenciListesi = veri;

        ogrencileriFiltrele();
        istatistikleriGuncelle();
        bolumAnaliziniGuncelle();

    } catch (hata) {
        console.error("Öğrenciler yüklenemedi:", hata);

        tablo.innerHTML = `
            <tr>
                <td colspan="4" class="empty">
                    Öğrenciler yüklenemedi. Spring Boot uygulamasını ve
                    /ogrenciler adresini kontrol et.
                </td>
            </tr>
        `;

        document.getElementById("sonucSayisi").textContent =
            "Veri alınamadı";

        document.getElementById("tabloBilgisi").textContent =
            "Bağlantı hatası";

        bildirimGoster("Öğrenci listesi yüklenemedi.", true);

    } finally {
        istekSuruyor = false;
    }
}


function ogrencileriFiltrele() {
    const arama = document.getElementById("arama")
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

    document.getElementById("sonucSayisi").textContent =
        `${filtrelenmis.length} öğrenci`;

    document.getElementById("tabloBilgisi").textContent =
        `Toplam ${ogrenciListesi.length} kayıt`;

    if (filtrelenmis.length === 0) {
        tablo.innerHTML = `
            <tr>
                <td colspan="4" class="empty">
                    ${
                        arama
                            ? "Aramana uygun öğrenci bulunamadı."
                            : "Henüz öğrenci kaydı bulunmuyor."
                    }
                </td>
            </tr>
        `;
        return;
    }

    tablo.innerHTML = filtrelenmis.map(ogrenci => {
        const id = Number(ogrenci.id);
        const ad = guvenliMetin(ogrenci.ad);
        const soyad = guvenliMetin(ogrenci.soyad);
        const bolum = guvenliMetin(ogrenci.bolum);

        const tamAd =
            `${ogrenci.ad || ""} ${ogrenci.soyad || ""}`.trim();

        const basHarfler = tamAd
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(kelime =>
                kelime.charAt(0).toLocaleUpperCase("tr-TR")
            )
            .join("");

        return `
            <tr>
                <td>
                    <div class="student-cell">
                        <div class="student-avatar">
                            ${guvenliMetin(basHarfler || "?")}
                        </div>

                        <div>
                            <div class="student-name">
                                ${ad} ${soyad}
                            </div>
                            <div class="student-subtitle">
                                Öğrenci kaydı
                            </div>
                        </div>
                    </div>
                </td>

                <td>
                    <span class="student-id">
                        #${guvenliMetin(ogrenci.id)}
                    </span>
                </td>

                <td>
                    <span class="department-badge">
                        ${bolum || "Bölüm belirtilmemiş"}
                    </span>
                </td>

                <td class="actions">
                    <button
                        type="button"
                        class="edit-button"
                        data-action="edit"
                        data-id="${id}">
                        Düzenle
                    </button>

                    <button
                        type="button"
                        class="delete-button"
                        data-action="delete"
                        data-id="${id}">
                        Sil
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    tablo.querySelectorAll("button[data-action]").forEach(buton => {
        buton.addEventListener("click", () => {
            const id = Number(buton.dataset.id);

            if (buton.dataset.action === "edit") {
                ogrenciDuzenle(id);
            } else {
                ogrenciSil(id);
            }
        });
    });
}

/* HTML metinlerini güvenli biçimde kodla */
function guvenliMetin(metin) {
    const eleman = document.createElement("span");

    eleman.textContent =
        metin == null ? "" : String(metin);

    return eleman.innerHTML;
}

function istatistikleriGuncelle() {
    document.getElementById("toplamOgrenci").textContent =
        ogrenciListesi.length;

    const bolumler = bolumVerileriniHesapla();

    document.getElementById("toplamBolum").textContent =
        bolumler.length;

    document.getElementById("grafikToplam").textContent =
        ogrenciListesi.length;
}

function bolumVerileriniHesapla() {
    const sayac = new Map();

    ogrenciListesi.forEach(ogrenci => {
        const bolum = (ogrenci.bolum || "").trim();

        if (!bolum) return;

        const anahtar = bolum.toLocaleLowerCase("tr-TR");

        if (!sayac.has(anahtar)) {
            sayac.set(anahtar, {
                ad: bolum,
                sayi: 0
            });
        }

        sayac.get(anahtar).sayi++;
    });

    return [...sayac.values()]
        .sort((a, b) => b.sayi - a.sayi);
}

function bolumAnaliziniGuncelle() {
    const bolumler = bolumVerileriniHesapla();

    bolumGrafikGuncelle(bolumler);
    bolumListesiniGuncelle(bolumler);
}

function bolumGrafikGuncelle(bolumler) {
    const canvas = document.getElementById("bolumGrafigi");
    const bosMesaji = document.getElementById("grafikBosMesaji");
    const lejand = document.getElementById("bolumLejandi");

    const grafikVerisi = bolumler.filter(
        bolum => bolum.sayi > 0
    );

    if (bolumGrafigi) {
        bolumGrafigi.destroy();
        bolumGrafigi = null;
    }

    lejand.innerHTML = "";

    if (typeof Chart === "undefined") {
        bosMesaji.hidden = false;
        bosMesaji.textContent =
            "Grafik kütüphanesi yüklenemedi. İnternet bağlantısını kontrol et.";

        canvas.style.display = "none";
        return;
    }

    canvas.style.display = "block";

    if (grafikVerisi.length === 0) {
        bosMesaji.hidden = false;
        return;
    }

    bosMesaji.hidden = true;

    const renkler = grafikVerisi.map(
        (_, index) =>
            grafikRenkleri[index % grafikRenkleri.length]
    );

    bolumGrafigi = new Chart(canvas, {
        type: "doughnut",

        data: {
            labels: grafikVerisi.map(bolum => bolum.ad),

            datasets: [{
                data: grafikVerisi.map(bolum => bolum.sayi),
                backgroundColor: renkler,
                borderWidth: 0,
                hoverOffset: 7,
                spacing: 4,
                borderRadius: 5
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "76%",

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    backgroundColor: "#172033",
                    padding: 12,
                    cornerRadius: 8,

                    callbacks: {
                        label: context =>
                            ` ${context.label}: ${context.raw} öğrenci`
                    }
                }
            }
        }
    });

    lejand.innerHTML = grafikVerisi.map((bolum, index) => `
        <span class="legend-item">
            <span
                class="legend-dot"
                style="background:${renkler[index]}">
            </span>
            ${guvenliMetin(bolum.ad)}
        </span>
    `).join("");
}

function bolumListesiniGuncelle(bolumler) {
    const alan = document.getElementById("bolumListesi");

    if (bolumler.length === 0) {
        alan.innerHTML = `
            <div class="loading-state">
                Henüz bölüm verisi yok. Öğrenci eklediğinde burada görünecek.
            </div>
        `;
        return;
    }

    const enYuksekSayi = bolumler[0].sayi;

    alan.innerHTML = bolumler.map((bolum, index) => {
        const yuzde = ogrenciListesi.length
            ? Math.round(
                bolum.sayi / ogrenciListesi.length * 100
            )
            : 0;

        const genislik = Math.round(
            bolum.sayi / enYuksekSayi * 100
        );

        const renk =
            grafikRenkleri[index % grafikRenkleri.length];

        return `
            <div class="department-item">
                <div class="department-meta">
                    <span class="department-name">
                        ${guvenliMetin(bolum.ad)}
                    </span>

                    <span class="department-count">
                        ${bolum.sayi}
                        <small>öğrenci · %${yuzde}</small>
                    </span>
                </div>

                <div class="progress-track">
                    <div
                        class="progress-fill"
                        style="width:${genislik}%;background:${renk}">
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function formuAc() {
    const form = document.getElementById("ogrenciFormu");

    form.reset();

    document.getElementById("ogrenciId").value = "";
    document.getElementById("formBasligi").textContent =
        "Yeni öğrenci ekle";

    document.getElementById("kaydetButonu").textContent =
        "Öğrenciyi kaydet";

    modalAc();

    document.getElementById("ad").focus();
}

function ogrenciDuzenle(id) {
    const ogrenci = ogrenciListesi.find(
        kayit => Number(kayit.id) === Number(id)
    );

    if (!ogrenci) {
        bildirimGoster(
            "Öğrenci bulunamadı. Listeyi yenile.",
            true
        );
        return;
    }

    document.getElementById("ogrenciId").value = ogrenci.id;
    document.getElementById("ad").value = ogrenci.ad || "";
    document.getElementById("soyad").value = ogrenci.soyad || "";
    document.getElementById("bolum").value = ogrenci.bolum || "";

    document.getElementById("formBasligi").textContent =
        "Öğrenciyi düzenle";

    document.getElementById("kaydetButonu").textContent =
        "Değişiklikleri kaydet";

    modalAc();

    document.getElementById("ad").focus();
}

function modalAc() {
    const modal = document.getElementById("ogrenciModal");

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
}

/* Modal penceresini kapat */
function formuKapat() {
    const modal = document.getElementById("ogrenciModal");

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
}

async function ogrenciKaydet(event) {
    event.preventDefault();

    const id = document.getElementById("ogrenciId").value;

    const ogrenci = {
        ad: document.getElementById("ad").value.trim(),
        soyad: document.getElementById("soyad").value.trim(),
        bolum: document.getElementById("bolum").value.trim()
    };

    if (!ogrenci.ad || !ogrenci.soyad || !ogrenci.bolum) {
        bildirimGoster(
            "Lütfen bütün alanları doldur.",
            true
        );
        return;
    }

    const kaydetButonu =
        document.getElementById("kaydetButonu");

    const eskiMetin = kaydetButonu.textContent;

    kaydetButonu.disabled = true;
    kaydetButonu.textContent = "Kaydediliyor...";

    try {
        const cevap = await fetch(
            id
                ? `${API_URL}/${encodeURIComponent(id)}`
                : API_URL,
            {
                method: id ? "PUT" : "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(ogrenci)
            }
        );

        if (cevap.status === 403) {
            formuKapat();

            bildirimGoster(
                "Bu işlemi gerçekleştirmek için Admin yetkisine sahip olmanız gerekiyor!",
                true
            );

            return;
        }

        /* Oturum açılmamışsa */
        if (cevap.status === 401) {
            formuKapat();

            bildirimGoster(
                "Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın.",
                true
            );

            return;
        }

        if (!cevap.ok) {
            const detay = await cevap.text();

            throw new Error(
                detay || `HTTP ${cevap.status}`
            );
        }

        formuKapat();

        document.getElementById("arama").value = "";

        await ogrencileriGetir();

        bildirimGoster(
            id
                ? "Öğrenci başarıyla güncellendi."
                : "Yeni öğrenci başarıyla eklendi."
        );

    } catch (hata) {
        console.error(
            "Öğrenci kaydetme hatası:",
            hata
        );

        bildirimGoster(
            "Kayıt başarısız. Sunucu veya veritabanını kontrol et.",
            true
        );

    } finally {
        kaydetButonu.disabled = false;
        kaydetButonu.textContent = eskiMetin;
    }
}

/* Öğrenciyi sil */
async function ogrenciSil(id) {
    const ogrenci = ogrenciListesi.find(
        kayit => Number(kayit.id) === Number(id)
    );

    const isim = ogrenci
        ? `${ogrenci.ad || ""} ${ogrenci.soyad || ""}`.trim()
        : "bu öğrenciyi";

    if (!confirm(
        `${isim} adlı öğrenciyi silmek istiyor musun?`
    )) {
        return;
    }

    try {
        const cevap = await fetch(
            `${API_URL}/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        if (cevap.status === 403) {
            bildirimGoster(
                "Bu işlemi gerçekleştirmek için Admin yetkisine sahip olmanız gerekiyor!",
                true
            );

            return;
        }

        /* Oturum açılmamışsa */
        if (cevap.status === 401) {
            bildirimGoster(
                "Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın.",
                true
            );

            return;
        }

        if (!cevap.ok) {
            throw new Error(
                `Silme isteği başarısız: HTTP ${cevap.status}`
            );
        }

        ogrenciListesi = ogrenciListesi.filter(
            kayit => Number(kayit.id) !== Number(id)
        );

        ogrencileriFiltrele();
        istatistikleriGuncelle();
        bolumAnaliziniGuncelle();

        bildirimGoster(
            "Öğrenci başarıyla silindi."
        );

    } catch (hata) {
        console.error(
            "Öğrenci silme hatası:",
            hata
        );

        bildirimGoster(
            "Öğrenci silinemedi. Sunucu bağlantısını kontrol et.",
            true
        );
    }
}

/* Kısa bildirim göster */
function bildirimGoster(mesaj, hata = false) {
    const alan = document.getElementById("bildirim");

    alan.textContent = mesaj;

    alan.classList.toggle("error", hata);
    alan.classList.add("show");

    clearTimeout(bildirimZamanlayicisi);

    bildirimZamanlayicisi = setTimeout(() => {
        alan.classList.remove("show");
    }, 3200);
}

/* Spring bean sayısını getir */
async function beanSayisiniGetir() {
    const alan = document.getElementById("beanSayisi");

    try {
        const cevap = await fetch(BEAN_URL);
        const veri = await jsonOku(cevap);

        const sayi = veri.beanSayisi ?? veri.beanCount;

        alan.textContent = sayi ?? "—";

        if (sayi == null) {
            console.warn(
                "Bean sayısı yanıtında beklenen alan bulunamadı:",
                veri
            );
        }

    } catch (hata) {
        console.warn(
            "Bean sayısı alınamadı:",
            hata
        );

        alan.textContent = "—";
    }
}

/* Spring Boot Actuator sağlık kontrolü */
async function sistemDurumunuGetir() {
    const durumAlani =
        document.getElementById("sistemDurumu");

    const kisaDurum =
        document.getElementById("kisaSistemDurumu");

    const miniDurum =
        document.getElementById("miniSistemDurumu");

    const detay =
        document.getElementById("sistemDetayi");

    const nokta =
        document.getElementById("miniDurumNoktasi");

    durumAlani.textContent = "Kontrol ediliyor";
    durumAlani.className = "system-badge pending";

    kisaDurum.textContent = "Kontrol ediliyor";
    miniDurum.textContent = "Kontrol ediliyor";

    nokta.classList.remove("online", "offline");

    try {
        const cevap = await fetch(HEALTH_URL);
        const veri = await cevap.json();

        if (cevap.ok && veri.status === "UP") {
            durumAlani.textContent = "Sistem çalışıyor";
            durumAlani.className = "system-badge online";

            kisaDurum.textContent = "Aktif";
            miniDurum.textContent = "Sistem aktif";

            detay.textContent =
                "Spring Boot sağlık kontrolü başarılı.";

            nokta.classList.add("online");

        } else {
            durumAlani.textContent = "Kontrol başarısız";
            durumAlani.className = "system-badge offline";

            kisaDurum.textContent = "Sorun var";
            miniDurum.textContent = "Kontrol gerekli";

            detay.textContent =
                "Sağlık kontrolü UP döndürmedi. Veritabanı veya uygulama durumunu kontrol et.";

            nokta.classList.add("offline");
        }

    } catch (hata) {
        console.warn(
            "Actuator sağlık kontrolü alınamadı:",
            hata
        );

        durumAlani.textContent = "Erişilemiyor";
        durumAlani.className = "system-badge offline";

        kisaDurum.textContent = "Bilinmiyor";
        miniDurum.textContent = "Erişilemiyor";

        detay.textContent =
            "Actuator adresine ulaşılamadı. Uygulamanın çalıştığını ve /actuator/health adresinin açık olduğunu kontrol et.";

        nokta.classList.add("offline");
    }
}