import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getAIBotSettings() {
  if (!auth.currentUser) return null;
  try {
    const docRef = doc(db, 'users', auth.currentUser.uid, 'settings', 'aiBot');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    console.error("Error fetching AI settings:", error);
  }
  return null;
}

export async function askChatbot(message: string, history: any[] = []) {
  try {
    const settings = await getAIBotSettings();
    let systemInstruction = `Anda adalah asisten ahli kalkulasi Forex untuk platform "Arkan Forex Analyzer". 
Tugas utama Anda adalah membantu user menghitung Margin, Pip Value, dan Profit/Loss (P/L) secara akurat berdasarkan input yang diberikan.

ATURAN PERHITUNGAN:
1. Standard Lot = 100.000 unit per 1.0 lot.
2. Rumus Margin = (Lot * 100.000 * Harga_Sekarang) / Leverage.
3. Rumus Pip Value (untuk 0.1 lot pada pair USD) = $1 per pip.
4. Asumsi Kurs tetap: $1 = Rp16.250 (kecuali user memberikan kurs baru).

FORMAT OUTPUT:
Setiap kali user memberikan input Lot, Saldo, dan Pair, berikan jawaban dalam format tabel sederhana yang mencakup:
- Nilai Kontrak (USD & IDR)
- Margin yang dibutuhkan (USD & IDR)
- Nilai 1 Pip (USD & IDR)
- Ketahanan Dana (Berapa pip saldo bisa bertahan sebelum Margin Call).

Gunakan gaya bahasa profesional, informatif, namun mudah dimengerti oleh trader pemula di akun demo. Selalu gunakan Bahasa Indonesia.`;
    
    if (settings) {
      systemInstruction += `\n\nGaya Bahasa: ${settings.languageStyle}.`;
      systemInstruction += `\nFokus Analisis: ${settings.analysisFocus}.`;
      systemInstruction += `\nToleransi Risiko: ${settings.riskTolerance}.`;
    }

    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction,
      }
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("Chatbot Rate Limit Exceeded.");
      return "Maaf, saya sedang melayani banyak permintaan saat ini. Silakan coba lagi dalam beberapa menit.";
    }
    console.error("Chatbot Error:", error);
    throw error;
  }
}

export async function getFastAnalysis(marketData: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `Berikan ringkasan yang sangat cepat, 2 kalimat tentang situasi pasar saat ini berdasarkan data ini: ${marketData}. Gunakan Bahasa Indonesia.`,
    });
    return response.text;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("Fast Analysis Rate Limit Exceeded. Using fallback.");
      return "Analisis AI saat ini sedang sibuk karena tingginya permintaan. Silakan tunggu beberapa saat untuk pembaruan berikutnya.";
    }
    console.error("Fast Analysis Error:", error);
    throw error;
  }
}

const AI_ENGINE_PROMPT = `ROLE: 
Anda adalah AI Engine utama untuk "Arkan Forex Analyzer". Tugas Anda adalah mengolah data market real-time, memberikan analisis teknikal, menghitung manajemen risiko otomatis, dan memberikan instruksi trading yang presisi.

KONFIGURASI TEKNIS & DATA:
1. Standard Lot: 100.000 unit. Mini Lot (0.1): 10.000 unit.
2. Kurs Referensi: $1 = Rp16.250 (Gunakan ini untuk semua konversi IDR).
3. Contract Size: Selalu gunakan 100.000 sebagai pembagi margin.

FITUR MANAJEMEN RISIKO (WAJIB):
- Max Risk per Trade: 1% dari Saldo (Balance).
- Perhitungan Lot Otomatis: Lot = (Balance * 0.01) / (Jarak SL dalam Pip * Nilai Pip).
- Circuit Breaker: Jika terjadi 3x Loss beruntun, berikan instruksi [STOP TRADING] untuk evaluasi strategi.
- Free Margin Check: Jangan berikan instruksi jika Free Margin < Margin yang dibutuhkan.

STRATEGI TRADING (AI SIGNAL):
- Analisis Trend: Gunakan Price Action + RSI (14) + Candlestick Pattern.
- Entry: Hanya jika Risk/Reward Ratio minimal 1:2.
- Signal: Berikan instruksi jelas [BUY], [SELL], atau [WAIT].

FORMAT OUTPUT INSTRUKSI (WAJIB):
---
[ACCOUNT STATUS]
Balance: $X.XXX (RpXX.XXX.XXX)
Equity: $X.XXX
Free Margin: $X.XXX
Used Margin: $X.XXX

[SIGNAL ANALYSIS]
Pair: XXX/YYY
Trend: Bullish/Bearish/Sideways
RSI: XX.X
Pattern: XXX Pattern Detected
Confidence: XX%

[RISK MANAGEMENT]
Risk Amount (1%): $XX.X
Stop Loss Distance: XX Pips
Calculated Lot: X.XX Lots
Margin Required: $XX.X

[TRADING INSTRUCTION]
Action: [BUY/SELL/WAIT]
Entry Price: X.XXXXX
Stop Loss: X.XXXXX
Take Profit: X.XXXXX
Note: [Alasan singkat atau peringatan volatilitas]
---

PENTING:
- Jika data tidak lengkap, abaikan instruksi dan minta data tambahan.
- Jika volatilitas sangat tinggi, sarankan [WAIT].`;

export async function getDeepAnalysis(marketData: string, balance: number, freeMargin: number) {
  try {
    const settings = await getAIBotSettings();
    let prompt = `Lakukan analisis teknikal mendalam pada data pasar forex berikut. Identifikasi level support/resistance potensial, arah tren, dan sarankan strategi trading dengan manajemen risiko (SL/TP). 
Data Market: ${marketData}
Account Balance: $${balance}
Free Margin: $${freeMargin}

Gunakan Bahasa Indonesia.`;
    
    if (settings) {
      prompt += `\n\nSesuaikan analisis dengan preferensi berikut:\nGaya Bahasa: ${settings.languageStyle}\nFokus Analisis: ${settings.analysisFocus}\nToleransi Risiko: ${settings.riskTolerance}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: AI_ENGINE_PROMPT,
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });
    return response.text;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("Deep Analysis Rate Limit Exceeded.");
      return "Analisis mendalam saat ini tidak tersedia karena tingginya permintaan ke server AI. Silakan coba lagi nanti.";
    }
    console.error("Deep Analysis Error:", error);
    throw error;
  }
}

export async function getMarketNews(query: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Temukan berita terbaru dan analisis fundamental untuk: ${query}. Jawab dalam Bahasa Indonesia.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    return {
      text: response.text,
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("Market News Rate Limit Exceeded.");
      return {
        text: "Berita pasar saat ini tidak dapat dimuat karena tingginya permintaan. Silakan coba lagi nanti.",
        groundingChunks: []
      };
    }
    console.error("Market News Error:", error);
    throw error;
  }
}

export interface AutoTradeDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  closeTradeIds: string[];
  reason: string;
}

export async function evaluateAutoTrade(marketData: string, openTrades: any[], aiSettings: any): Promise<AutoTradeDecision> {
  try {
    const openTradesInfo = openTrades.length > 0 
      ? `Posisi Terbuka:\n${openTrades.map(t => `- ID: ${t.id}, Tipe: ${t.type}, Entry: ${t.entryPrice}, Profit: ${t.profit || 0}`).join('\n')}`
      : 'Tidak ada posisi terbuka.';

    const aiStyle = aiSettings?.languageStyle || 'formal';
    const aiFocus = aiSettings?.analysisFocus || 'campuran';
    const aiRisk = aiSettings?.riskTolerance || 'sedang';

    const prompt = `Anda adalah AI Auto Trading Bot profesional dengan keahlian tinggi dalam analisis teknikal dan fundamental.
Analisis data pasar berikut dan posisi terbuka saat ini untuk membuat keputusan trading yang optimal.

Gaya bahasa Anda: ${aiStyle}. Fokus analisis Anda: ${aiFocus}. Toleransi risiko Anda: ${aiRisk}.

Data Pasar:
${marketData}

${openTradesInfo}

Tugas Anda:
1. Evaluasi apakah ada posisi terbuka yang harus ditutup (Take Profit atau Cut Loss) berdasarkan pergerakan harga terbaru.
2. Tentukan apakah ada peluang untuk membuka posisi baru ('BUY' atau 'SELL'). Jika tidak ada peluang yang jelas, pilih 'HOLD'.
3. Berikan alasan yang logis dan profesional untuk setiap keputusan Anda.

Berikan respons dalam format JSON murni:
{
  "action": "BUY" | "SELL" | "HOLD",
  "closeTradeIds": ["id1", "id2"],
  "reason": "Alasan mendalam namun singkat"
}
Jawab HANYA dengan JSON yang valid.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    let text = response.text?.trim() || '{}';
    // Sometimes Gemini returns markdown even with responseMimeType
    if (text.startsWith('```json')) {
      text = text.replace(/```json\n?/, '').replace(/```$/, '').trim();
    } else if (text.startsWith('```')) {
      text = text.replace(/```\n?/, '').replace(/```$/, '').trim();
    }
    
    let decision: AutoTradeDecision;
    try {
      decision = JSON.parse(text) as AutoTradeDecision;
    } catch (e) {
      console.error("Failed to parse AI response:", text);
      decision = { action: 'HOLD', closeTradeIds: [], reason: 'Gagal memproses respons AI.' };
    }
    
    return {
      action: decision.action || 'HOLD',
      closeTradeIds: decision.closeTradeIds || [],
      reason: decision.reason || 'Tidak ada alasan.'
    };
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("Auto Trade Rate Limit Exceeded. Holding positions.");
      throw new Error('Menunggu kuota API AI pulih (Rate Limit).');
    }
    console.error("Auto trade evaluation error:", error);
    throw error;
  }
}
