/**
 * Google Gemini AI Integration Service for GulaMate
 * Memberikan jawaban cerdas seputar nutrisi, kadar gula makanan/minuman,
 * dan konsultasi kesehatan pencegahan diabetes.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const GEMINI_STORAGE_KEY = '@GulaMate:gemini_api_key';

export interface MimoChatContext {
  userName: string;
  todaySugar: number;
  sugarLimit: number;
  recentMessages?: { sender: 'mimo' | 'user'; text: string }[];
}

/**
 * Mendapatkan API Key Gemini (dari AsyncStorage atau .env)
 */
export async function getGeminiApiKey(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(GEMINI_STORAGE_KEY);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  } catch {}
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
}

/**
 * Menyimpan API Key Gemini pengguna
 */
export async function setGeminiApiKey(apiKey: string): Promise<void> {
  if (apiKey && apiKey.trim()) {
    await AsyncStorage.setItem(GEMINI_STORAGE_KEY, apiKey.trim());
  } else {
    await AsyncStorage.removeItem(GEMINI_STORAGE_KEY);
  }
}

/**
 * Memeriksa apakah Gemini API Key sudah terkonfigurasi
 */
export async function isGeminiConfigured(): Promise<boolean> {
  const key = await getGeminiApiKey();
  return Boolean(key && key.trim().length > 10);
}

/**
 * Memanggil endpoint Google Gemini API (gemini-1.5-flash / gemini-2.0-flash)
 */
async function callGeminiApi(
  userQuestion: string,
  context: MimoChatContext,
  apiKey: string
): Promise<string> {
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

  const remaining = Math.max(0, context.sugarLimit - context.todaySugar);
  const systemPrompt = `Kamu adalah "Mimo", maskot toples gula yang ceria, ramah, imut, dan ahli nutrisi kesehatan dari aplikasi mobile GulaMate.
Tujuanmu adalah membantu pengguna memantau asupan gula harian untuk pencegahan dini diabetes melitus sesuai standar Kemenkes RI dan WHO.

Konteks pengguna saat ini:
- Nama panggilan: ${context.userName || 'Teman Manis'}
- Asupan gula hari ini: ${Math.round(context.todaySugar)} gram
- Batas aman harian: ${context.sugarLimit} gram (sisa kuota: ${remaining.toFixed(0)} gram)

Panduan Jawaban:
1. Jawablah langsung, hangat, bersahabat, dan edukatif dalam bahasa Indonesia yang luwes (tidak kaku).
2. Jika pengguna menanyakan kandungan gula makanan/minuman (misal: "berapa gram pada kopi susu", "kandungan gula boba", dsb.):
   - Sebutkan takaran gram gula yang realistis per porsi/ukuran sajian standar.
   - Konversikan juga ke takaran sendok teh (1 sendok teh = ~4 gram gula).
   - Bandingkan dengan sisa kuota gula harian pengguna (${remaining.toFixed(0)}g lagi).
   - Berikan tips pemesanan/konsumsi sehat (misal: minta less sugar 30-50%, pilih opsi tawar, atau imbangi dengan air putih).
3. Jika pengguna bertanya tips diet/diabetes/olahraga, jelaskan secara ilmiah tapi mudah dipahami di layar smartphone.
4. Gunakan bullet point atau emoji pemanis agar pesan rapi dan nyaman dibaca.`;

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nPertanyaan ${context.userName}: "${userQuestion}"\n\nJawaban Mimo:`,
            },
          ],
        },
      ];

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) {
          return text.trim();
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`Gemini API ${model} response notice:`, errJson);
        lastError = new Error(errJson?.error?.message || `HTTP ${res.status}`);
      }
    } catch (e: any) {
      console.warn(`Gemini API connection notice for ${model}:`, e);
      lastError = e;
    }
  }

  throw lastError || new Error('Gagal menghubungi Gemini AI');
}

/**
 * Mesin Pengetahuan Gizi & Nutrisi Lokal Cerdas (Fallback Offline AI Engine)
 * Memastikan pertanyaan seperti "berapa gram pada kopi susu..." selalu terjawab
 * dengan presisi tinggi meskipun saat offline atau sebelum API key diisi.
 */
function generateLocalMimoResponse(
  userQuestion: string,
  context: MimoChatContext
): string {
  const q = userQuestion.toLowerCase().trim();
  const remaining = Math.max(0, context.sugarLimit - context.todaySugar);

  // 1. Kopi Susu (Khusus pertanyaan user "berapa gram pada kopi susu....")
  if (q.includes('kopi') && (q.includes('susu') || q.includes('aren') || q.includes('latte') || q.includes('kenangan') || q.includes('janji jiwa'))) {
    return `☕ **Kopi Susu Gula Aren** (ukuran reguler ~350ml / 1 cup):\n` +
      `• **Kadar Gula:** rata-rata **20 – 25 gram** (setara **5 – 6 sendok teh gula pasir!**)\n` +
      `• **Kalori:** ~180 – 220 kkal\n` +
      `• **Dampak ke Kuota:** Mengambil sekitar **40% – 50%** dari batas harianmu (${context.sugarLimit}g).\n\n` +
      `💡 **Tips Sehat dari Mimo:**\n` +
      `1. Pesan level *"Less Sugar"* (30% atau 50%) untuk menghemat 10–12 gram gula.\n` +
      `2. Pilih susu rendah lemak (*low-fat*) atau susu oat/almond tanpa pemanis tambahan.\n` +
      `3. Setelah minum kopi susu manis, minumlah 1–2 gelas air putih untuk membantu hidrasi ginjal.`;
  }

  // 2. Kopi Hitam / Americano
  if (q.includes('kopi') && (q.includes('hitam') || q.includes('americano') || q.includes('espresso') || q.includes('tubruk tawar'))) {
    return `☕ **Kopi Hitam / Americano (Tanpa Gula):**\n` +
      `• **Kadar Gula:** **0 gram** (Aman 100% dari gula tambahan!)\n` +
      `• **Kalori:** Hanya ~2 – 5 kkal\n` +
      `• Mengandung antioksidan polifenol tinggi yang baik untuk meningkatkan sensitivitas insulin. Pilihan terbaik untuk dinikmati kapan saja! ✨`;
  }

  // 3. Boba & Milk Tea
  if (q.includes('boba') || q.includes('bubble tea') || q.includes('brown sugar')) {
    return `🧋 **Boba Brown Sugar Milk Tea** (ukuran 500ml):\n` +
      `• **Kadar Gula:** **38 – 45 gram** (setara **9 – 11 sendok teh gula!**)\n` +
      `• Mutiara tapioka (boba)-nya sendiri dimasak dalam rendaman sirup gula pekat (~15g gula hanya dari boba saja).\n` +
      `• **Status:** Hampir menghabiskan seluruh batas gula harianmu (${context.sugarLimit}g) hanya dalam 1 cup!\n\n` +
      `💡 **Tips Sehat Mimo:** Minta 'Slight Sugar' (25–30%) dan ganti topping boba dengan grass jelly atau aloe vera yang jauh lebih ramah gula.`;
  }

  // 4. Es Teh Manis / Teh Botol / Teh Tarik
  if (q.includes('teh manis') || q.includes('es teh') || q.includes('teh botol') || q.includes('teh tarik') || q.includes('thai tea')) {
    return `🍹 **Es Teh Manis & Teh Tarik:**\n` +
      `• **Es Teh Manis Biasa (250ml):** ~**18 – 22 gram gula** (~4–5 sdt gula).\n` +
      `• **Teh Tarik / Thai Tea:** ~**24 – 30 gram gula** (menggunakan kental manis dan krimer kental).\n` +
      `• **Teh Kemasan Botol (350ml):** ~**20 – 26 gram gula**.\n\n` +
      `💡 **Tips Sehat Mimo:** Beralihlah ke **Es Teh Tawar** (0 gram gula). Kalau ingin sensasi segar, tambahkan perasan lemon atau daun mint!`;
  }

  // 5. Minuman Bersoda / Minuman Kaleng
  if (q.includes('soda') || q.includes('coca') || q.includes('pepsi') || q.includes('fanta') || q.includes('sprite')) {
    return `🥤 **Minuman Bersoda (1 kaleng 330ml):**\n` +
      `• **Kadar Gula:** **35 – 39 gram gula** (setara **9 sendok teh gula pasir murni!**)\n` +
      `• Soda memiliki indeks glikemik sangat tinggi tanpa serat/protein, memicu lonjakan glukosa darah dan insulin secara mendadak.\n\n` +
      `💡 **Alternatif Mimo:** Air mineral berkarbonasi (*sparkling water*) dengan irisan jeruk nipis atau stroberi dingin.`;
  }

  // 6. Martabak Manis & Camilan Tradisional
  if (q.includes('martabak') || q.includes('terang bulan')) {
    return `🥞 **Martabak Manis (1 potong sedang):**\n` +
      `• **Kadar Gula:** **18 – 25 gram gula** per potong (adonan gula + taburan gula pasir + susu kental manis).\n` +
      `• **Kalori:** ~270 – 350 kkal per potong.\n\n` +
      `💡 **Saran Mimo:** Nikmati maksimal 1 potong saja dan hindari makan martabak larut malam agar tidak mengganggu metabolisme glukosa saat tidur.`;
  }

  // 7. Donat, Roti Manis, & Kue
  if (q.includes('donat') || q.includes('roti manis') || q.includes('brownies') || q.includes('cake') || q.includes('kue')) {
    return `🍩 **Donat & Roti Manis:**\n` +
      `• **1 buah donat glazed:** ~**12 – 15 gram gula**.\n` +
      `• **1 buah donat cokelat / isi selai:** ~**18 – 24 gram gula**.\n` +
      `• **1 potong brownies (50g):** ~**19 gram gula**.\n\n` +
      `💡 **Tips Sehat Mimo:** Kombinasikan dengan protein (misal telur rebus atau susu kedelai tawar) untuk memperlambat lonjakan gula darah.`;
  }

  // 8. Buah & Gula Alami
  if (q.includes('buah') || q.includes('pisang') || q.includes('apel') || q.includes('mangga') || q.includes('semangka')) {
    return `🍎 **Gula pada Buah Utuh (Fruktosa Alami):**\n` +
      `• **Apel sedang (1 buah):** ~10g gula alami + 4g serat pangan.\n` +
      `• **Pisang sedang (1 buah):** ~12g gula alami + kalium.\n` +
      `• **Mangga (1 buah):** ~22g gula alami.\n\n` +
      `✨ **Catatan Penting Mimo:** Gula pada buah utuh **jauh lebih aman** daripada gula tambahan karena ada serat nabati yang menahan penyerapan glukosa ke pembuluh darah!`;
  }

  // 9. Nasi & Karbohidrat
  if (q.includes('nasi') || q.includes('mie') || q.includes('karbo')) {
    return `🍚 **Nasi Putih & Karbohidrat:**\n` +
      `• **Gula sederhana:** ~0,2 gram (sangat rendah gula bebas).\n` +
      `• **Karbohidrat kompleks:** ~40 gram per piring sedang (150g).\n` +
      `• Nasi putih memiliki Indeks Glikemik cukup tinggi (~73). Di dalam tubuh, karbohidrat ini akan dipecah menjadi glukosa darah.\n\n` +
      `💡 **Tips Mimo:** Imbangi dengan sayuran hijau kaya serat dan lauk protein agar laju penyerapan gula darah tetap stabil.`;
  }

  // 10. Cara Membakar Gula / Olahraga
  if (q.includes('bakar') || q.includes('olahraga') || q.includes('jalan') || q.includes('latihan')) {
    return `🏃‍♂️ **Cara Cepat Membakar Kelebihan Gula Hari Ini:**\n` +
      `• **Jalan kaki santai 20–30 menit:** Otot kaki akan menyerap glukosa darah secara langsung tanpa tergantung insulin!\n` +
      `• **Naik turun tangga 10 menit:** Efektif membakar ~10–15g glukosa.\n` +
      `• **Banyak minum air putih:** Membantu ginjal menyaring dan membuang kelebihan gula lewat urine.\n\n` +
      `Semangat! Bergerak sedikit saja sesudah makan sudah sangat membantu menstabilkan gula darahmu. ✨`;
  }

  // 11. Sugar Crash / Mengantuk setelah makan
  if (q.includes('ngantuk') || q.includes('lemas') || q.includes('sugar crash') || q.includes('lelah')) {
    return `😴 **Kenapa Mengantuk Setelah Makan Manis? (Sugar Crash):**\n` +
      `Ketika kamu mengonsumsi gula dalam jumlah banyak, pankreas memproduksi lonjakan hormon insulin untuk menurunkan gula darah secara cepat.\n` +
      `Akibatnya, kadar gula darah turun drastis secara tiba-tiba (*crash*), membuat otak kekurangan energi sesaat dan timbullah rasa kantuk atau lemas.\n\n` +
      `💡 **Solusi Mimo:** Hindari karbohidrat sederhana murni. Selalu sertakan serat dan lemak sehat agar energi dilepaskan secara bertahap.`;
  }

  // 12. Pemanis Pengganti Gula / Stevia
  if (q.includes('stevia') || q.includes('pengganti gula') || q.includes('pemanis buatan') || q.includes('diabetasol')) {
    return `🌿 **Pemanis Pengganti Gula:**\n` +
      `• **Stevia (Daun Stevia Alami):** 0 kalori, 0 indeks glikemik, aman untuk diabetes dan tidak menaikkan gula darah.\n` +
      `• **Erythritol / Monk Fruit:** Pemanis alami bebas kalori yang tidak memicu fermentasi berlebih di pencernaan.\n\n` +
      `Keduanya adalah pilihan tepat bagi ${context.userName} yang ingin tetap merasakan manis tanpa risiko lonjakan glukosa!`;
  }

  // 13. Pertanyaan Umum / Default Cerdas
  return `Halo ${context.userName}! Pertanyaanmu tentang "${userQuestion}" sangat menarik. 💡\n\n` +
    `Sebagai acuan sehat, Kementerian Kesehatan RI menganjurkan batas konsumsi gula harian maksimal **50 gram per hari (4 sendok makan)**.\n\n` +
    `Hari ini kamu sudah mengonsumsi **${Math.round(context.todaySugar)}g**, dengan sisa kuota aman **${remaining.toFixed(0)}g**.\n\n` +
    `Mimo bisa bantu hitung gram gula minuman/makanan favoritmu lho (misal: "berapa gram pada kopi susu", "gula boba", atau "cara bakar gula"). Mau tanya apa lagi? 😊`;
}

/**
 * Fungsi Utama: Menjawab pertanyaan chat dengan Gemini AI (dengan fallback lokal andal)
 */
export async function askMimoAI(
  userQuestion: string,
  context: MimoChatContext
): Promise<string> {
  const apiKey = await getGeminiApiKey();

  // Jika API Key tersedia, hubungi Gemini AI
  if (apiKey) {
    try {
      const response = await callGeminiApi(userQuestion, context, apiKey);
      return response;
    } catch (err: any) {
      console.warn('Gemini AI fallback triggered:', err?.message || err);
    }
  }

  // Gunakan Local Intelligent Engine jika tanpa API key atau offline
  return generateLocalMimoResponse(userQuestion, context);
}

/**
 * Meminta estimasi kandungan gula dari Gemini AI untuk katalog/pencarian
 */
export async function askGeminiSugarEstimate(
  foodName: string,
  apiKey: string
): Promise<{ sugarGrams: number; confidence: 'high' | 'medium' | 'estimated'; explanation: string; servingDesc: string } | null> {
  const prompt = `Analisis kandungan gula untuk makanan/minuman berikut: "${foodName}".
Berikan estimasi gram gula realistis per porsi standar berdasarkan basis data nutrisi Kemenkes RI atau USDA.
Jawab HANYA dalam format JSON murni tanpa pembungkus codeblock markdown dan tanpa teks tambahan apapun:
{"sugarGrams": 22, "confidence": "high", "explanation": "Estimasi Gemini AI: ~22g gula per cup reguler", "servingDesc": "1 cup reguler (350ml)"}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 250 },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (typeof parsed.sugarGrams === 'number') {
          return {
            sugarGrams: parsed.sugarGrams,
            confidence: parsed.confidence || 'high',
            explanation: parsed.explanation || `Estimasi Gemini AI: ~${parsed.sugarGrams}g gula`,
            servingDesc: parsed.servingDesc || '1 porsi standar',
          };
        }
      }
    }
  } catch (e) {
    console.warn('Gemini sugar estimate notice:', e);
  }
  return null;
}
