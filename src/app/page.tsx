"use client";
import { useState } from "react";
import { fisOkutAI } from "./actions";

export default function Home() {
  const [durum, setDurum] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const fotoYukle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setYukleniyor(true);
    setDurum("Fotoğraf yapay zeka için optimize ediliyor...");
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = async () => {
        // --- RESİM SIKIŞTIRMA (Sunucuyu yormamak ve hızlı gitmek için) ---
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200; 
        
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const optimizeBase64 = canvas.toDataURL("image/jpeg", 0.8);
        // -----------------------------------------------------------------

        setDurum("Yapay zeka fişi inceliyor, adisyonları kesiyor kral...");
        const sonuc = await fisOkutAI(optimizeBase64);
        setDurum(sonuc.message);
        setYukleniyor(false);
      };
    };
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-black mb-2 text-amber-500">KAFE KASA</h1>
      <p className="text-zinc-400 mb-8">Z Raporu Yapay Zeka Sistemi</p>
      
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-2xl text-center w-full max-w-md">
        
        <label className={`block font-bold py-5 px-6 rounded-lg cursor-pointer transition-all ${yukleniyor ? 'bg-zinc-700 text-zinc-400' : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/50'}`}>
          {yukleniyor ? "⏳ Yapay Zeka Okuyor..." : "📸 Fişin Fotoğrafını Çek"}
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={fotoYukle} disabled={yukleniyor} />
        </label>

        <div className="mt-6 p-4 rounded bg-zinc-950 min-h-[80px] flex items-center justify-center border border-zinc-800/50 text-center">
          <p className={durum.includes("HATA") || durum.includes("Error") ? "text-red-400 font-medium" : "text-emerald-400 font-medium"}>
            {durum || "Fişi okutmak için butona bas."}
          </p>
        </div>

        <a href="/rapor" className="mt-6 block w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium text-zinc-300 transition-all">
          📊 Patron Ekranına (Z Raporu) Git
        </a>
      </div>
    </div>
  );
}