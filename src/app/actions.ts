"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../db";
import { sales, products } from "../db/schema";
import { eq } from "drizzle-orm";

// Yapay zeka şifresini çekiyoruz
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function fisOkutAI(imageBase64: string) {
  try {
    // 1. Model Ayarı (En güncel ve hızlı 2.5 Flash sürümü)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Sen bir kafe otomasyon sistemisin. Sana gönderilen fiş görselindeki satılan ürünleri dikkatlice oku.
      Her ürün için: Ürün Adı, Satılan Miktar (Adet) ve o ürünün o satırdaki Toplam Tutarını çıkart.
      KDV, Toplam, Nakit gibi ödeme satırlarını kesinlikle alma.
      Yalnızca şu JSON formatında bir dizi döndür, başka hiçbir açıklama yazma:
      [
        { "name": "ORMAN BÜYÜSÜ", "quantity": 16, "totalAmount": 2240.00 }
      ]
    `;

    // Base64 resim verisini yapay zekanın anlayacağı formata çeviriyoruz
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      },
    };

    // Yapay zekaya isteği fırlatıyoruz
    const result = await model.generateContent([prompt, imagePart]);
    let responseText = result.response.text();

    // Markdown süslemeleri varsa temizle
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const satilanUrunler = JSON.parse(responseText);

    // 2. Veritabanına (Kasaya) Kaydetme Bölümü
    for (const urun of satilanUrunler) {
      let [menudekiUrun] = await db.select().from(products).where(eq(products.name, urun.name.toUpperCase()));
      
      // Ürün menüde yoksa ilk kez ekle
      if (!menudekiUrun) {
        const [yeniUrun] = await db.insert(products).values({
          name: urun.name.toUpperCase(),
          price: (Number(urun.totalAmount) / Number(urun.quantity)).toString(),
        }).returning();
        menudekiUrun = yeniUrun;
      }

      // Satışı adisyona işle
      await db.insert(sales).values({
        productId: menudekiUrun.id,
        quantity: Number(urun.quantity),
        totalAmount: Number(urun.totalAmount).toString(),
      });
    }

    return { success: true, message: `Yapay zeka fişi başarıyla çözdü kral! Toplam ${satilanUrunler.length} kalem ürün işlendi.` };

  } catch (error: any) {
    console.error(error);
    return { success: false, message: "HATA: " + (error.message || "Yapay zeka şu an yoğun, tekrar dene kral.") };
  }
}

// --- PATRON RAPOR ANALİZ MOTORU ---
export async function raporVerileriniGetir() {
  try {
    const veriler = await db.select({
      isim: products.name,
      miktar: sales.quantity,
      tutar: sales.totalAmount,
      tarih: sales.createdAt,
    }).from(sales).innerJoin(products, eq(sales.productId, products.id));
    
    return veriler.map(v => ({
      ...v,
      tarih: v.tarih.toISOString(),
      tutar: Number(v.tutar)
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

// --- KASAYI SIFIRLAMA MOTORU ---
export async function kasayiSifirla() {
  try {
    await db.delete(sales);
    return { success: true, message: "Kasa sıfırlandı kral, tertemiz sayfa açtık!" };
  } catch (error) {
    return { success: false, message: "Sıfırlarken hata çıktı." };
  }
}