"use client";
import { useEffect, useState } from "react";
import { raporVerileriniGetir, kasayiSifirla } from "../actions";

export default function PatronEkrani() {
  const [veriler, setVeriler] = useState<any[]>([]);
  const [filtre, setFiltre] = useState("bugun"); 
  const [yukleniyor, setYukleniyor] = useState(true);

  const simdi = new Date();
  const [basYil, setBasYil] = useState(simdi.getFullYear().toString());
  const [basAy, setBasAy] = useState((simdi.getMonth() + 1).toString().padStart(2, "0"));
  const [basGun, setBasGun] = useState(simdi.getDate().toString().padStart(2, "0"));

  const [bitYil, setBitYil] = useState(simdi.getFullYear().toString());
  const [bitAy, setBitAy] = useState((simdi.getMonth() + 1).toString().padStart(2, "0"));
  const [bitGun, setBitGun] = useState(simdi.getDate().toString().padStart(2, "0"));

  const baslangicTarihi = `${basYil}-${basAy}-${basGun}`;
  const bitisTarihi = `${bitYil}-${bitAy}-${bitGun}`;

  const AYLAR = [
    { value: "01", label: "Ocak" }, { value: "02", label: "Şubat" },
    { value: "03", label: "Mart" }, { value: "04", label: "Nisan" },
    { value: "05", label: "Mayıs" }, { value: "06", label: "Haziran" },
    { value: "07", label: "Temmuz" }, { value: "08", label: "Ağustos" },
    { value: "09", label: "Eylül" }, { value: "10", label: "Ekim" },
    { value: "11", label: "Kasım" }, { value: "12", label: "Aralık" },
  ];

  const GUNLER = Array.from({ length: 31 }, (_, i) => ({
    value: (i + 1).toString().padStart(2, "0"),
    label: (i + 1).toString(),
  }));

  const YILLAR = Array.from({ length: 5 }, (_, i) => ({
    value: (simdi.getFullYear() - 2 + i).toString(),
    label: (simdi.getFullYear() - 2 + i).toString(),
  }));

  const verileriYukle = () => {
    setYukleniyor(true);
    raporVerileriniGetir().then((data) => {
      setVeriler(data);
      setYukleniyor(false);
    });
  };

  useEffect(() => {
    verileriYukle();
  }, []);

  const dukkaniSifirla = async () => {
    if (confirm("Kral, kasadaki tüm eski satış test verilerini silmek istediğine emin misin?")) {
      const sonuc = await kasayiSifirla();
      alert(sonuc.message);
      verileriYukle();
    }
  };
  
  const tarihYazisiGetir = () => {
    if (filtre === "bugun") return simdi.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    if (filtre === "hafta") {
      const gecenHafta = new Date(simdi.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `${gecenHafta.toLocaleDateString('tr-TR')} - ${simdi.toLocaleDateString('tr-TR')}`;
    }
    if (filtre === "ay") return simdi.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    if (filtre === "ozel") {
      const bas = new Date(baslangicTarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      const bit = new Date(bitisTarihi).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      return `${bas} - ${bit}`;
    }
    return "Tüm Zamanların Satış Kaydı";
  };

  const filtrelenmisVeriler = veriler.filter((v: any) => {
    const satisTarihi = new Date(v.tarih);
    if (filtre === "ozel") {
      const baslangic = new Date(baslangicTarihi); baslangic.setHours(0,0,0,0);
      const bitis = new Date(bitisTarihi); bitis.setHours(23,59,59,999);
      return satisTarihi >= baslangic && satisTarihi <= bitis;
    }
    const farkGun = (simdi.getTime() - satisTarihi.getTime()) / (1000 * 3600 * 24);
    if (filtre === "bugun") return farkGun < 1; 
    if (filtre === "hafta") return farkGun < 7;  
    if (filtre === "ay") return farkGun < 30;    
    return true; 
  });

  const toplamCiro = filtrelenmisVeriler.reduce((toplam: number, urun: any) => toplam + urun.tutar, 0);
  const toplamUrun = filtrelenmisVeriler.reduce((toplam: number, urun: any) => toplam + urun.miktar, 0);

  // Dümdüz harita mantığıyla gruplama, TypeScript'in ruhu bile duymayacak
  const urunGruplari: any = {};
  filtrelenmisVeriler.forEach((urun: any) => {
    if (!urunGruplari[urun.isim]) {
      urunGruplari[urun.isim] = { miktar: 0, ciro: 0 };
    }
    urunGruplari[urun.isim].miktar += urun.miktar;
    urunGruplari[urun.isim].ciro += urun.tutar;
  });

  // HATA VEREN O SPREAD MANTIĞINI SİLDİM, DÜMDÜZ DİZİYE ÇEVİRİYORUM
  const siralama = Object.keys(urunGruplari).map((isim) => {
    return {
      isim: isim,
      miktar: urunGruplari[isim].miktar,
      ciro: urunGruplari[isim].ciro
    };
  }).sort((a: any, b: any) => b.ciro - a.ciro);

  const enCokSatan = siralama.length > 0 ? siralama[0].isim : "Yok";

  if (yukleniyor) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Kasa sayılıyor kral...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Üst Başlık */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-4xl font-black text-amber-500">PATRON EKRANI</h1>
            <p className="text-zinc-400 text-lg mt-1">
              Gelişmiş Z Raporu • <span className="text-amber-500 font-semibold">{tarihYazisiGetir()}</span>
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={dukkaniSifirla} className="bg-red-950 hover:bg-red-900 text-red-400 px-4 py-2.5 rounded-lg border border-red-900/50 transition-all font-medium text-sm">
              🗑️ Kasayı Sıfırla
            </button>
            <a href="/" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-5 py-2.5 rounded-lg transition-all font-medium whitespace-nowrap text-sm flex items-center">
              📸 Kameraya Dön
            </a>
          </div>
        </div>

        {/* Filtreleme Paneli */}
        <div className="flex flex-col gap-4 mb-8 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          <div className="flex flex-wrap gap-2">
            {["bugun", "hafta", "ay", "ozel", "hepsi"].map((f) => (
              <button
                key={f}
                onClick={() => setFiltre(f)}
                className={`px-4 py-2 rounded-md font-medium text-sm capitalize transition-all ${filtre === f ? "bg-amber-600 text-white" : "text-zinc-400 hover:text-white bg-zinc-950"}`}
              >
                {f === "bugun" ? "Bugün" : f === "hafta" ? "Bu Hafta" : f === "ay" ? "Bu Ay" : f === "ozel" ? "📅 Özel Tarih Seç" : "Tüm Zamanlar"}
              </button>
            ))}
          </div>

          {/* %100 TÜRKÇE MANUEL SEÇİM PANELİ */}
          {filtre === "ozel" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 mt-2">
              <div>
                <p className="text-sm font-bold text-amber-500 mb-2">Başlangıç Tarihi</p>
                <div className="flex gap-2">
                  <select value={basGun} onChange={(e) => setBasGun(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500 flex-1">
                    {GUNLER.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                  <select value={basAy} onChange={(e) => setBasAy(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500 flex-1">
                    {AYLAR.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                  <select value={basYil} onChange={(e) => setBasYil(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500 flex-1">
                    {YILLAR.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-amber-500 mb-2">Bitiş Tarihi</p>
                <div className="flex gap-2">
                  <select value={bitGun} onChange={(e) => setBitGun(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500 flex-1">
                    {GUNLER.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                  <select value={bitAy} onChange={(e) => setBitAy(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500 flex-1">
                    {AYLAR.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                  <select value={bitYil} onChange={(e) => setBitYil(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500 flex-1">
                    {YILLAR.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-lg">
            <p className="text-zinc-400 mb-1 font-medium">Toplam Ciro</p>
            <p className="text-3xl font-black text-emerald-400">{toplamCiro.toLocaleString('tr-TR')} ₺</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-lg">
            <p className="text-zinc-400 mb-1 font-medium">Satılan Ürün Adedi</p>
            <p className="text-3xl font-black text-amber-500">{toplamUrun}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-lg">
            <p className="text-xl font-bold text-white truncate">{enCokSatan}</p>
          </div>
        </div>

        {/* Satış Detay Tablosu */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Satılan Ürün</th>
                <th className="p-4 font-semibold text-center">Adet</th>
                <th className="p-4 font-semibold text-right">Ciro (TL)</th>
              </tr>
            </thead>
            <tbody>
              {siralama.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-zinc-500">
                    Seçili tarih aralığında henüz satış kaydı yok kral.
                  </td>
                </tr>
              ) : (
                siralama.map((satir: any, index: number) => (
                  <tr key={index} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-all">
                    <td className="p-4 font-medium text-zinc-200">{satir.isim}</td>
                    <td className="p-4 text-center text-amber-500 font-bold">{satir.miktar}</td>
                    <td className="p-4 text-right text-emerald-400 font-bold">{satir.ciro.toLocaleString('tr-TR')} ₺</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}