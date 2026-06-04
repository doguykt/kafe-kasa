"use client";
import { useEffect, useState } from "react";
import { raporVerileriniGetir, kasayiSifirla } from "../actions";

export default function PatronEkrani() {
  const [veriler, setVeriler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    raporVerileriniGetir().then((data: any) => {
      setVeriler(data || []);
      setYukleniyor(false);
    });
  }, []);

  if (yukleniyor) return <div>Yükleniyor...</div>;

  return (
    <div className="p-8 bg-zinc-950 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-amber-500">Kasa Raporu</h1>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-zinc-700">
            <th className="p-2">Ürün</th>
            <th className="p-2">Adet</th>
            <th className="p-2">Tutar</th>
          </tr>
        </thead>
        <tbody>
          {veriler.map((v: any, i: number) => (
            <tr key={i} className="border-b border-zinc-800">
              <td className="p-2">{v.isim}</td>
              <td className="p-2">{v.miktar}</td>
              <td className="p-2">{v.tutar} ₺</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}