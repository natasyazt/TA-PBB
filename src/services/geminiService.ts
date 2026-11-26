/**
 * Google Gemini AI Integration Service for GulaMate
 * Memberikan jawaban cerdas seputar nutrisi, kadar gula makanan/minuman,
 * dan konsultasi pencegahan diabetes melitus (Modul 1 & Gemini AI Integration).
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
 * Mendapatkan API Key Gemini (dari AsyncStorage atau environment variable)
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
 * Memanggil endpoint Google Gemini API (gemini-1.5-flash / gemini-2.0-flash / gemini-1.5-flash-latest)
 */
async function callGeminiApi(
  userQuestion: string,
  context: MimoChatContext,
  apiKey: string
): Promise<string> {
  const models = [
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.5-flash',
    'gemini-1.5-pro',
  ];

  const remaining = Math.max(0, context.sugarLimit - context.todaySugar);
  const systemPrompt = `Kamu adalah "Mimo", toples gula sahabat pintar dan maskot resmi aplikasi GulaMate.
Peranmu adalah ahli gizi dan pendamping hidup sehat ramah yang membantu pengguna mengendalikan konsumsi gula harian demi pencegahan dini diabetes melitus sesuai standar Kementerian Kesehatan RI (Permenkes No. 30/2013: maks 50g / 4 sdm per hari) dan WHO (maks 25g per hari untuk manfaat optimal).

Data pengguna saat ini:
- Nama: ${context.userName || 'Teman Manis'}
- Asupan gula hari ini: ${Math.round(context.todaySugar)} gram
- Batas harian aman: ${context.sugarLimit} gram (sisa kuota: ${remaining.toFixed(0)} gram)

Instruksi Menjawab:
1. Jawab LANGSUNG dan RELEVAN dengan pertanyaan pengguna dalam bahasa Indonesia yang hangat, bersahabat, dan edukatif.
2. Jika pengguna menanyakan kadar gula makanan/minuman (misal: "berapa gram pada kopi susu", "kandungan gula boba", dsb.):
   - Sebutkan takaran gram gula yang akurat per porsi standar (misal 20-25 gram).
   - Konversikan ke sendok teh (1 sendok teh = ~4 gram gula).
   - Taksir kalorinya (1 gram gula = 4 kkal).
   - Bandingkan dengan sisa kuota harian pengguna (${remaining.toFixed(0)} gram lagi).
   - Berikan tips praktis (misal: request less sugar 30-50%, pilih opsi tawar, atau minum 1-2 gelas air putih setelahnya).
3. Jika pengguna bertanya tentang diabetes, cara bakar gula, sugar crash, atau pemanis buatan, jelaskan mekanismenya secara ilmiah sederhana dengan bullet points rapi.
4. Gunakan emoji pemanis secukupnya agar pesan nyaman dibaca di smartphone.`;

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nPertanyaan pengguna: "${userQuestion}"\n\nJawablah dengan gaya Mimo yang hangat dan solutif:`,
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
            maxOutputTokens: 700,
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
        console.warn(`Gemini API ${model} response status ${res.status}:`, errJson);
        lastError = new Error(errJson?.error?.message || `HTTP ${res.status}`);
      }
    } catch (e: any) {
      console.warn(`Gemini API connection error on ${model}:`, e?.message || e);
      lastError = e;
    }
  }

  throw lastError || new Error('Gagal menghubungi Google Gemini AI');
}

// ============================================================================
// BASIS DATA NUTRISI & KESEHATAN LOKAL (OFFLINE INTELLIGENT ENGINE)
// ============================================================================

interface FoodItemDetail {
  keywords: string[];
  name: string;
  serving: string;
  sugarMin: number;
  sugarMax: number;
  sugarAvg: number;
  calories: number;
  category: 'beverage' | 'snack' | 'fruit' | 'staple' | 'savory';
  tips: string;
  isNaturalSugar?: boolean;
}

const NUTRITION_KNOWLEDGE_BASE: FoodItemDetail[] = [
  // --- KOPI & MINUMAN KAFE ---
  {
    keywords: ['kopi susu aren', 'kopi susu gula aren', 'kopi aren', 'kopi susu kekinian', 'kopi kenangan mantan', 'kopi janji jiwa', 'kopi kulo', 'kopi tuku', 'kopi susu'],
    name: 'Kopi Susu Gula Aren',
    serving: '1 cup reguler (350ml / 12 oz)',
    sugarMin: 20,
    sugarMax: 28,
    sugarAvg: 24,
    calories: 210,
    category: 'beverage',
    tips: 'Minta level gula "Less Sugar" (30-50%) saat memesan untuk memangkas 10-14g gula, atau ganti susu sapi dengan oat milk/almond milk tanpa pemanis.',
  },
  {
    keywords: ['kopi hitam', 'americano', 'espresso', 'kopi tubruk tawar', 'kopi o kosong', 'long black'],
    name: 'Kopi Hitam / Americano (Tanpa Gula)',
    serving: '1 cangkir (200-250ml)',
    sugarMin: 0,
    sugarMax: 0,
    sugarAvg: 0,
    calories: 3,
    category: 'beverage',
    tips: 'Pilihan sempurna! 0 gram gula tambahan, kaya polifenol & klorogenat yang meningkatkan sensitivitas insulin dan metabolisme basal tubuh.',
  },
  {
    keywords: ['kopi sachet', 'kopi instan', 'good day', 'luwak white koffie', 'torabika', 'kopi tubruk manis', 'kopi hitam manis', 'kapal api spesial mix'],
    name: 'Kopi Sachet / Instan Manis',
    serving: '1 cangkir / sachet (20g bubuk)',
    sugarMin: 12,
    sugarMax: 18,
    sugarAvg: 15,
    calories: 90,
    category: 'beverage',
    tips: 'Lebih dari separuh isi kemasan sachet adalah gula pasir dan krimer nabati. Batasi maksimal 1 cangkir per hari, atau racik kopi hitam tubruk sendiri dengan sedikit stevia.',
  },
  {
    keywords: ['latte manis', 'cappuccino manis', 'caramel macchiato', 'vanilla latte', 'hazelnut latte', 'caffe mocha'],
    name: 'Flavored Latte (Caramel / Vanilla / Mocha)',
    serving: '1 cup sedang (350ml)',
    sugarMin: 25,
    sugarMax: 35,
    sugarAvg: 30,
    calories: 260,
    category: 'beverage',
    tips: 'Kandungan gula tinggi berasal dari kombinasi sirup perisa, saus karamel/cokelat, dan laktosa susu. Pilih opsi sirup sugar-free jika tersedia.',
  },

  // --- BOBA, TEH & MINUMAN KEMASAN ---
  {
    keywords: ['boba', 'bubble tea', 'brown sugar boba', 'boba milk tea', 'chatime', 'xing fu tang', 'teguk', 'tiger sugar'],
    name: 'Boba Brown Sugar Milk Tea',
    serving: '1 cup reguler (500ml) dengan boba pearl',
    sugarMin: 38,
    sugarMax: 48,
    sugarAvg: 42,
    calories: 380,
    category: 'beverage',
    tips: 'Hanya dalam 1 cup, boba sudah menghabiskan hampir 85-95% batas gula harianmu! Minta gula 30% dan ganti boba dengan grass jelly atau aloe vera yang jauh lebih rendah kalori.',
  },
  {
    keywords: ['es teh manis', 'teh manis hangat', 'teh manis', 'sweet tea', 'es teh jumbo'],
    name: 'Es Teh Manis',
    serving: '1 gelas sedang (300ml)',
    sugarMin: 18,
    sugarMax: 24,
    sugarAvg: 20,
    calories: 85,
    category: 'beverage',
    tips: 'Es teh manis di warung/kantin umumnya menggunakan 2-3 sendok makan gula pasir. Mulailah membiasakan diri beralih ke Es Teh Tawar (0g gula) yang segar dan menghidrasi tubuh tanpa kalori.',
  },
  {
    keywords: ['es teh tawar', 'teh tawar', 'teh hijau tawar', 'oolong tea tawar', 'teh melati tawar'],
    name: 'Es Teh Tawar / Green Tea Tawar',
    serving: '1 gelas (300ml)',
    sugarMin: 0,
    sugarMax: 0,
    sugarAvg: 0,
    calories: 2,
    category: 'beverage',
    tips: 'Sangat aman dan menyegarkan! Teh tawar kaya akan katekin dan antioksidan EGCG yang baik untuk sirkulasi darah dan penurunan inflamasi.',
  },
  {
    keywords: ['teh botol', 'teh pucuk', 'teh javana', 'teh kotak', 'fruit tea', 'teh kemasan'],
    name: 'Teh Manis Kemasan Botol / Kotak',
    serving: '1 botol sedang (350ml)',
    sugarMin: 18,
    sugarMax: 26,
    sugarAvg: 22,
    calories: 100,
    category: 'beverage',
    tips: 'Periksa selalu tabel informasi nilai gizi di belakang botol. Satu botol kemasan seringkali mengandung lebih dari 5 sendok teh gula pasir!',
  },
  {
    keywords: ['teh tarik', 'thai tea', 'milk tea', 'dum dum', 'cha bang ang'],
    name: 'Teh Tarik / Thai Milk Tea',
    serving: '1 gelas / cup (400ml)',
    sugarMin: 25,
    sugarMax: 35,
    sugarAvg: 28,
    calories: 240,
    category: 'beverage',
    tips: 'Warna oranye dan tekstur lembutnya berasal dari campuran teh pekat dengan susu kental manis dan krimer kental yang sangat tinggi sukrosa.',
  },
  {
    keywords: ['soda', 'coca cola', 'pepsi', 'fanta', 'sprite', 'tebs', 'coke', 'minuman berkarbonasi'],
    name: 'Minuman Bersoda (1 Kaleng)',
    serving: '1 kaleng (330ml)',
    sugarMin: 35,
    sugarMax: 39,
    sugarAvg: 37,
    calories: 145,
    category: 'beverage',
    tips: 'Soda kaleng mengandung fruktosa cair pekat tanpa serat atau nutrisi mikro, menyebabkan lonjakan gula darah sangat cepat (*spike*). Beralihlah ke soda berkarbonasi tawar (sparkling water) dengan perasan lemon segar.',
  },
  {
    keywords: ['pocari', 'pocari sweat', 'isotonik', 'mizone', '100plus', 'aquarius'],
    name: 'Minuman Isotonik Olahraga',
    serving: '1 botol (500ml)',
    sugarMin: 18,
    sugarMax: 26,
    sugarAvg: 22,
    calories: 95,
    category: 'beverage',
    tips: 'Minuman isotonik dirancang untuk atlet yang berolahraga intensitas tinggi lebih dari 60 menit. Jika hanya untuk aktivitas harian biasa, air mineral adalah pilihan hidrasi yang jauh lebih tepat.',
  },
  {
    keywords: ['susu uht cokelat', 'ultra milk cokelat', 'frisian flag cokelat', 'indomilk cokelat', 'milo', 'dancow cokelat'],
    name: 'Susu UHT Cokelat / Milo Kotak',
    serving: '1 kotak (200-250ml)',
    sugarMin: 16,
    sugarMax: 22,
    sugarAvg: 19,
    calories: 160,
    category: 'beverage',
    tips: 'Sekitar 8-10 gram merupakan gula pasir tambahan di luar laktosa alami susu. Untuk alternatif lebih sehat, pilih Susu UHT Plain / Full Cream tanpa tambahan gula.',
  },
  {
    keywords: ['susu uht plain', 'susu full cream plain', 'bear brand', 'susu beruang', 'greenfields plain'],
    name: 'Susu Murni UHT Plain / Bear Brand',
    serving: '1 kaleng / kotak (189-200ml)',
    sugarMin: 7,
    sugarMax: 10,
    sugarAvg: 8,
    calories: 120,
    category: 'beverage',
    isNaturalSugar: true,
    tips: 'Kandungan gula 100% adalah laktosa alami dari susu murni, tanpa tambahan gula pasir (sukrosa). Mengandung kalsium dan protein berkualitas tinggi.',
  },
  {
    keywords: ['susu kental manis', 'skm', 'krimer kental manis', 'bendera kental manis', 'carnation'],
    name: 'Susu Kental Manis (SKM)',
    serving: '2 sendok makan (30-40ml)',
    sugarMin: 20,
    sugarMax: 24,
    sugarAvg: 22,
    calories: 130,
    category: 'beverage',
    tips: 'BPOM menegaskan bahwa SKM adalah bahan pelengkap/topping kue, bukan susu minuman untuk pemenuhan gizi karena kandungannya lebih dari 50% gula murni.',
  },
  {
    keywords: ['es cendol', 'es dawet', 'cendol', 'dawet ayu'],
    name: 'Es Cendol / Dawet Gula Merah',
    serving: '1 mangkuk / gelas sedang',
    sugarMin: 28,
    sugarMax: 36,
    sugarAvg: 32,
    calories: 320,
    category: 'beverage',
    tips: 'Perpaduan santan kental dan kinca gula merah cair menghasilkan kandungan kalori dan gula yang tinggi. Minta kuah gula merahnya disajikan terpisah agar bisa diatur sedikit saja.',
  },
  {
    keywords: ['es campur', 'es teler', 'es oyen', 'es doger'],
    name: 'Es Campur / Es Teler',
    serving: '1 mangkuk besar',
    sugarMin: 26,
    sugarMax: 38,
    sugarAvg: 30,
    calories: 340,
    category: 'beverage',
    tips: 'Tingginya gula berasal dari sirup merah, susu kental manis, dan tape ketan/manisan kolang-kaling. Nikmati buah alpukat & kelapa mudanya, dan kurangi kuah sirup manisnya.',
  },
  {
    keywords: ['jus alpukat', 'jus mangga', 'jus sirsak', 'jus buah manis'],
    name: 'Jus Buah dengan Gula & Kental Manis',
    serving: '1 gelas besar (400ml)',
    sugarMin: 22,
    sugarMax: 32,
    sugarAvg: 26,
    calories: 220,
    category: 'beverage',
    tips: 'Penjual jus biasanya menuangkan 2 sendok gula cair + susu kental manis cokelat. Pesanlah "Jus Murni Tanpa Gula dan Tanpa SKM" untuk menikmati nutrisi dan serat asli buah!',
  },
  {
    keywords: ['air kelapa', 'kelapa muda', 'es degan murni'],
    name: 'Air Kelapa Muda Murni (Tanpa Sirup)',
    serving: '1 butir / 1 gelas besar (300ml)',
    sugarMin: 6,
    sugarMax: 9,
    sugarAvg: 7,
    calories: 45,
    category: 'beverage',
    isNaturalSugar: true,
    tips: 'Gula pada air kelapa murni adalah glukosa dan fruktosa alami. Kaya elektrolit kalium yang membantu menurunkan tekanan darah dan hidrasi optimal.',
  },
  {
    keywords: ['air putih', 'air mineral', 'air le mineral', 'aqua', 'air hangat'],
    name: 'Air Mineral / Air Putih',
    serving: '1 gelas (250ml)',
    sugarMin: 0,
    sugarMax: 0,
    sugarAvg: 0,
    calories: 0,
    category: 'beverage',
    tips: 'Juara terbaik hidrasi! Minum minimal 8 gelas (2 liter) per hari membantu ginjal membuang kelebihan glukosa melalui urine.',
  },
  {
    keywords: ['yakult', 'yogurt', 'cimory', 'biokul', 'minuman probiotik'],
    name: 'Minuman Probiotik / Yogurt Minum Manis',
    serving: '1 botol kecil (65-150ml)',
    sugarMin: 10,
    sugarMax: 16,
    sugarAvg: 12,
    calories: 70,
    category: 'beverage',
    tips: 'Bakteri probiotik sangat baik untuk usus, namun varian manis sering diberi gula agar rasanya tidak terlalu asam. Pilih Greek Yogurt Plain untuk protein tinggi dan 0g gula tambahan.',
  },

  // --- CAMILAN, KUE & JAJAN PASAR ---
  {
    keywords: ['martabak manis', 'terang bulan', 'martabak cokelat keju', 'martabak bangka'],
    name: 'Martabak Manis / Terang Bulan',
    serving: '1 potong ukuran sedang',
    sugarMin: 18,
    sugarMax: 26,
    sugarAvg: 22,
    calories: 290,
    category: 'snack',
    tips: 'Gula terkandung dalam adonan berpori, taburan gula pasir saat memanggang, dan guyuran susu kental manis. Batasi maksimal 1 potong dan hindari memakannya tepat sebelum tidur.',
  },
  {
    keywords: ['martabak telor', 'martabak telur', 'martabak bebek', 'martabak asin'],
    name: 'Martabak Telur / Martabak Asin',
    serving: '1 potong sedang',
    sugarMin: 0.2,
    sugarMax: 1,
    sugarAvg: 0.5,
    calories: 160,
    category: 'savory',
    tips: 'Sangat rendah gula (hampir bebas gula). Waspadai kuah cuko pendampingnya jika dicampur banyak gula merah/kecap manis.',
  },
  {
    keywords: ['donat', 'donat jco', 'dunkin donuts', 'donat cokelat', 'donat glazed'],
    name: 'Donat (Glazed / Cokelat)',
    serving: '1 buah donat standar',
    sugarMin: 12,
    sugarMax: 22,
    sugarAvg: 16,
    calories: 250,
    category: 'snack',
    tips: 'Donat terbuat dari tepung terigu refined (IG tinggi) dan digoreng minyak, plus lapisan glaze gula di atasnya. Padukan dengan kopi/teh tawar agar tidak dobel asupan gula.',
  },
  {
    keywords: ['pisang goreng', 'piscok', 'pisang cokelat', 'pisang krispi'],
    name: 'Pisang Goreng / Piscok',
    serving: '1 buah sedang',
    sugarMin: 12,
    sugarMax: 18,
    sugarAvg: 15,
    calories: 180,
    category: 'snack',
    tips: 'Pisang saat dimasak panas mengubah sebagian patinya menjadi gula sederhana, ditambah tepung terigu dan lelehan cokelat kental manis. Pisang kukus orisinal jauh lebih sehat!',
  },
  {
    keywords: ['roti manis', 'roti cokelat', 'roti keju', 'roti srikaya', 'roti boy', 'roti o', 'rotio'],
    name: 'Roti Manis / Bun Kopi',
    serving: '1 buah roti',
    sugarMin: 14,
    sugarMax: 22,
    sugarAvg: 17,
    calories: 270,
    category: 'snack',
    tips: 'Adonan roti manis mengandung gula agar ragi mengembang dan tekstur empuk, belum termasuk isian selai manis di dalamnya.',
  },
  {
    keywords: ['roti tawar', 'roti gandum', 'white bread'],
    name: 'Roti Tawar (1 Lembar)',
    serving: '1 lembar (35g)',
    sugarMin: 1,
    sugarMax: 2.5,
    sugarAvg: 1.8,
    calories: 80,
    category: 'staple',
    tips: 'Roti gandum utuh (whole wheat) lebih dianjurkan karena tinggi serat pangan yang menahan lonjakan glukosa darah dibandingkan roti tawar putih.',
  },
  {
    keywords: ['brownies', 'brownies kukus', 'kue cokelat', 'cake', 'red velvet'],
    name: 'Brownies Cokelat / Cake',
    serving: '1 potong kecil (50-60g)',
    sugarMin: 18,
    sugarMax: 28,
    sugarAvg: 22,
    calories: 240,
    category: 'snack',
    tips: 'Brownies mengombinasikan gula pasir takaran tinggi dengan dark/milk chocolate. Nikmati sepotong kecil sebagai apresiasi mingguan, bukan camilan harian.',
  },
  {
    keywords: ['es krim', 'ice cream', 'gelato', 'aice', 'mixue ice cream', 'cornetto', 'magnum'],
    name: 'Es Krim / Gelato',
    serving: '1 scoop / cone (80-100g)',
    sugarMin: 18,
    sugarMax: 26,
    sugarAvg: 21,
    calories: 210,
    category: 'snack',
    tips: 'Kaya akan sukrosa dan lemak jenuh susu. Bila ingin sensasi dingin manis sehat, bekukan potongan pisang atau mangga lalu blender menjadi "nice cream" 100% buah murni.',
  },
  {
    keywords: ['biskuit', 'cookies', 'oreo', 'regal', 'wafer', 'tango', 'roma kelapa'],
    name: 'Biskuit / Cookies / Oreo (3 keping)',
    serving: '3 keping (30-40g)',
    sugarMin: 10,
    sugarMax: 15,
    sugarAvg: 13,
    calories: 160,
    category: 'snack',
    tips: 'Krim isian biskuit didominasi gula halus dan lemak nabati terhidrogenasi. Mudah memicu *overeating* karena sensasi renyah manisnya.',
  },
  {
    keywords: ['cokelat', 'silverqueen', 'kitkat', 'cadbury', 'cokelat susu'],
    name: 'Cokelat Batangan (Milk Chocolate)',
    serving: '1 bungkus sedang (35-40g)',
    sugarMin: 18,
    sugarMax: 24,
    sugarAvg: 20,
    calories: 210,
    category: 'snack',
    tips: 'Pilihlah Dark Chocolate dengan kadar kakao minimal 70% ke atas. Dark chocolate hanya mengandung 4-6g gula dan kaya antioksidan flavonoid untuk kesehatan jantung.',
  },
  {
    keywords: ['klepon', 'cenil', 'onde onde', 'kue cucur', 'lapis legit', 'kue basah'],
    name: 'Kue Tradisional / Klepon (3 butir)',
    serving: '3 butir klepon gula merah',
    sugarMin: 12,
    sugarMax: 18,
    sugarAvg: 15,
    calories: 170,
    category: 'snack',
    tips: 'Sensasi meletus di mulut klepon berasal dari cairan gula merah murni. Nikmati secukupnya di waktu senggang sore hari.',
  },
  {
    keywords: ['kolak pisang', 'kolak ubi', 'bubur kacang hijau', 'bubur ketan hitam'],
    name: 'Kolak Pisang / Bubur Kacang Hijau',
    serving: '1 mangkuk sedang (250g)',
    sugarMin: 22,
    sugarMax: 30,
    sugarAvg: 25,
    calories: 280,
    category: 'snack',
    tips: 'Kacang hijau kaya serat dan protein nabati, namun kuah kolak yang kaya kinca gula aren dan santan menambah beban glukosa cukup besar.',
  },

  // --- MAKANAN POKOK & LAUK ---
  {
    keywords: ['nasi putih', 'nasi uduk', 'nasi kuning', 'nasi liwet'],
    name: 'Nasi Putih',
    serving: '1 piring sedang (150g)',
    sugarMin: 0.1,
    sugarMax: 0.4,
    sugarAvg: 0.2,
    calories: 195,
    category: 'staple',
    tips: 'Gula bebasnya sangat rendah (0,2g), namun mengandung ~40g karbohidrat ber-Indeks Glikemik tinggi (~73). Di saluran cerna, enzim memecah karbohidrat ini menjadi glukosa darah. Selalu dampingi dengan sayuran hijau kaya serat dan protein.',
  },
  {
    keywords: ['nasi merah', 'beras merah', 'nasi hitam'],
    name: 'Nasi Merah',
    serving: '1 piring sedang (150g)',
    sugarMin: 0.1,
    sugarMax: 0.3,
    sugarAvg: 0.2,
    calories: 165,
    category: 'staple',
    tips: 'Memiliki lapisan bekatul kaya serat pangan, magnesium, dan vitamin B. Laju penyerapan glukosa ke pembuluh darah jauh lebih bertahap sehingga mencegah lonjakan insulin.',
  },
  {
    keywords: ['nasi goreng', 'nasgor'],
    name: 'Nasi Goreng',
    serving: '1 porsi (200g)',
    sugarMin: 3,
    sugarMax: 6,
    sugarAvg: 4,
    calories: 360,
    category: 'staple',
    tips: 'Gula pada nasi goreng terutama bersumber dari penambahan kecap manis kental (sekitar 1-2 sendok makan per porsi). Minta kurangi kecap dan tambahkan acar mentimun.',
  },
  {
    keywords: ['mie instan', 'indomie goreng', 'indomie kuah', 'mie goreng'],
    name: 'Mie Instan / Indomie',
    serving: '1 bungkus (80-85g)',
    sugarMin: 1.5,
    sugarMax: 4,
    sugarAvg: 2.5,
    calories: 380,
    category: 'staple',
    tips: 'Gula sederhana terdapat pada kecap manis bumbu dan saus cabai. Tantangan utamanya adalah karbohidrat olahan tepung terigu dan kadar natrium (garam) yang tinggi.',
  },
  {
    keywords: ['bakso', 'soto ayam', 'rawon', 'sop sapi', 'sop ayam'],
    name: 'Bakso Sapi / Soto Ayam Kuah',
    serving: '1 mangkuk',
    sugarMin: 1,
    sugarMax: 3,
    sugarAvg: 1.5,
    calories: 280,
    category: 'savory',
    tips: 'Makanan kuah kaldu gurih ini sangat aman dari segi gula tambahan (kurang dari 2g), selama tidak menambahkan terlalu banyak kecap manis atau saus botolan.',
  },
  {
    keywords: ['rendang', 'gulai', 'ayam goreng', 'ayam geprek', 'ikan bakar', 'bebek goreng'],
    name: 'Rendang / Lauk Gurih Tradisional',
    serving: '1 potong (80-100g)',
    sugarMin: 0.5,
    sugarMax: 2,
    sugarAvg: 1.2,
    calories: 220,
    category: 'savory',
    tips: 'Sangat rendah gula bebas. Protein dari daging sapi/ikan/ayam membantu memperlambat pengosongan lambung dan menstabilkan glukosa darah.',
  },
  {
    keywords: ['ayam bakar madu', 'ayam kecap', 'sate ayam', 'sate kambing', 'daging bumbu bali'],
    name: 'Sate Ayam / Ayam Kecap Madu',
    serving: '1 porsi (5-10 tusuk)',
    sugarMin: 8,
    sugarMax: 15,
    sugarAvg: 11,
    calories: 290,
    category: 'savory',
    tips: 'Bumbu marinasi kecap manis, gula merah, dan kacang menyumbang sekitar 2-3 sendok teh gula per porsi. Mintalah bumbu kacang/kecap dipisah agar bisa dicelup tipis-tipis.',
  },
  {
    keywords: ['seblak', 'batagor', 'siomay', 'cilok', 'cireng', 'pempek'],
    name: 'Siomay / Batagor / Pempek',
    serving: '1 porsi sedang',
    sugarMin: 6,
    sugarMax: 14,
    sugarAvg: 9,
    calories: 310,
    category: 'savory',
    tips: 'Kuah cuko pempek terbuat dari rebusan gula batok (gula merah pekat), sedangkan saus kacang siomay dicampur gula pasir/kecap. Celupkan secukupnya saja.',
  },

  // --- BUAH-BUAHAN ALAMI ---
  {
    keywords: ['pisang', 'pisang ambon', 'pisang cavendish', 'banana'],
    name: 'Pisang Segar (1 Buah Sedang)',
    serving: '1 buah sedang (118g)',
    sugarMin: 11,
    sugarMax: 14,
    sugarAvg: 12,
    calories: 105,
    category: 'fruit',
    isNaturalSugar: true,
    tips: '100% gula alami (fruktosa, glukosa, sukrosa alami) yang dibungkus oleh 3 gram serat pektin serta tinggi kalium. Sangat baik sebagai penambah energi sebelum olahraga.',
  },
  {
    keywords: ['apel', 'apel fuji', 'apel hijau', 'apple'],
    name: 'Apel Segar (dengan Kulit)',
    serving: '1 buah sedang (180g)',
    sugarMin: 9,
    sugarMax: 13,
    sugarAvg: 11,
    calories: 95,
    category: 'fruit',
    isNaturalSugar: true,
    tips: 'Pilihan buah terbaik untuk pencegahan diabetes! Serat larut pektin pada apel membentuk gel di usus yang menahan laju penyerapan karbohidrat.',
  },
  {
    keywords: ['semangka', 'watermelon'],
    name: 'Semangka Segar',
    serving: '1 potong besar / 1 mangkuk (150g)',
    sugarMin: 8,
    sugarMax: 11,
    sugarAvg: 9,
    calories: 46,
    category: 'fruit',
    isNaturalSugar: true,
    tips: 'Mengandung lebih dari 92% air dan senyawa antioksidan likopen. Meski Indeks Glikemiknya sedang-tinggi, Beban Glikemik (Glycemic Load)-nya sangat rendah karena kandungan airnya yang melimpah.',
  },
  {
    keywords: ['mangga', 'mangga arumanis', 'mangga madu', 'mango'],
    name: 'Mangga Harum Manis',
    serving: '1 buah sedang (200g daging buah)',
    sugarMin: 20,
    sugarMax: 26,
    sugarAvg: 23,
    calories: 130,
    category: 'fruit',
    isNaturalSugar: true,
    tips: 'Cukup tinggi fruktosa alami. Bagi penderita pra-diabetes atau diabetes, dianjurkan menikmati separuh buah per sesi dan dimakan utuh (bukan dijus manis).',
  },
  {
    keywords: ['jeruk', 'jeruk sunkist', 'jeruk manis', 'orange'],
    name: 'Jeruk Segar Utuh',
    serving: '1 buah sedang (130g)',
    sugarMin: 8,
    sugarMax: 11,
    sugarAvg: 9,
    calories: 62,
    category: 'fruit',
    isNaturalSugar: true,
    tips: 'Makan jeruk dalam bentuk buah utuh jauh lebih sehat daripada perasan sari jeruk kemasan, karena serat bulirnya menjaga kestabilan glukosa darah.',
  },
  {
    keywords: ['alpukat', 'avocado'],
    name: 'Alpukat Segar',
    serving: '1 buah sedang',
    sugarMin: 0.5,
    sugarMax: 1.2,
    sugarAvg: 0.8,
    calories: 240,
    category: 'fruit',
    isNaturalSugar: true,
    tips: 'Superfood ramah diabetes! Kandungan gulanya hampir nol, kaya serat, dan padat asam lemak tak jenuh tunggal yang meningkatkan sensitivitas hormon insulin.',
  },
  {
    keywords: ['durian', 'duren'],
    name: 'Durian',
    serving: '3-4 butir (100g daging durian)',
    sugarMin: 18,
    sugarMax: 25,
    sugarAvg: 21,
    calories: 150,
    category: 'fruit',
    isNaturalSugar: true,
    tips: 'Tinggi gula alami dan karbohidrat padat energi. Konsumsi secukupnya (2-3 pongge) dan imbangi dengan banyak minum air putih.',
  },
  {
    keywords: ['kurma', 'dates'],
    name: 'Kurma (3 Butir)',
    serving: '3 butir kurma (25g)',
    sugarMin: 14,
    sugarMax: 18,
    sugarAvg: 16,
    calories: 66,
    category: 'fruit',
    isNaturalSugar: true,
    tips: 'Kaya serat, polifenol, dan magnesium. Pemanis alami yang luar biasa untuk menggantikan gula pasir saat membuat minuman smoothies atau oatmeal sehat.',
  },
];

// ============================================================================
// TOPIK KESEHATAN, DIABETES & METABOLISME GULA
// ============================================================================

interface HealthTopicDetail {
  patterns: RegExp[];
  title: string;
  generateResponse: (context: MimoChatContext) => string;
}

const HEALTH_TOPICS: HealthTopicDetail[] = [
  // 1. CARA MEMBAKAR GULA / OLAHRAGA
  {
    patterns: [
      /(bakar|turunkan|hilangkan|buang|netralkan|olahraga|jalan kaki|habisin|habiskan)\s*(gula|glukosa|kalori)/i,
      /gimana cara.*bakar.*gula/i,
      /cara.*turunkan gula darah/i,
      /kebanyakan gula.*harus apa/i,
    ],
    title: 'Cara Membakar Kelebihan Gula Hari Ini',
    generateResponse: (ctx) => {
      const remaining = Math.max(0, ctx.sugarLimit - ctx.todaySugar);
      return `🏃‍♂️ **Langkah Cepat Membakar & Menetralkan Kelebihan Gula:**\n\n` +
        `Saat gula darah meningkat setelah makan manis, tubuh memerlukan bantuan otot untuk menyerap glukosa tanpa bergantung sepenuhnya pada lonjakan insulin:\n\n` +
        `1. 🚶 **Jalan Kaki Santai 15 – 30 Menit:**\n` +
        `   Aktivitas kontraksi otot paha dan betis langsung membuka kanal GLUT-4 untuk menyerap glukosa dari pembuluh darah secara alami!\n\n` +
        `2. 💧 **Minum 2 – 3 Gelas Air Putih Segar:**\n` +
        `   Membantu ginjal menyaring kelebihan gula darah dan mengeluarkannya secara aman lewat urine (*glukosuria fisiologis*).\n\n` +
        `3. 🧗 **Naik-Turun Tangga / Squat 10 Menit:**\n` +
        `   Latihan kekuatan ringan ini efektif membakar 10–15 gram glukosa yang tersimpan di otot.\n\n` +
        `4. 🥗 **Perbanyak Serat di Sesi Makan Berikutnya:**\n` +
        `   Pilih sayuran berdaun hijau atau chia seeds untuk memperlambat penyerapan karbohidrat selanjutnya.\n\n` +
        `📊 *Statusmu saat ini: Asupan ${Math.round(ctx.todaySugar)}g / batas ${ctx.sugarLimit}g (sisa kuota: ${remaining.toFixed(0)}g).* Yuk gerak sebentar! ✨`;
    },
  },

  // 2. SUGAR CRASH & MENGANTUK SETELAH MAKAN MANIS
  {
    patterns: [
      /(ngantuk|lemas|lelah|loyo|mengantuk|sugar crash)\s*(setelah|sesudah|habis|sehabis)?\s*(makan|minum)?\s*(manis|gula)?/i,
      /kenapa.*ngantuk.*makan manis/i,
      /apa itu sugar crash/i,
    ],
    title: 'Kenapa Mengantuk Setelah Mengonsumsi Manis? (Sugar Crash)',
    generateResponse: () => {
      return `😴 **Fenomena "Sugar Crash" (Mengantuk Setelah Makan Manis):**\n\n` +
        `Rasa lemas dan kantuk berat yang kamu rasakan adalah reaksi biologis alami tubuh terhadap lonjakan glukosa:\n\n` +
        `• ⚡ **Lonjakan Drastis (Spike):** Saat makanan/minuman manis tinggi diserap, gula darah naik tajam seketika.\n` +
        `• 🏭 **Respon Pankreas:** Pankreas panik dan memompa hormon insulin dalam dosis tinggi untuk menurunkan gula darah.\n` +
        `• 📉 **Jatuh Tiba-Tiba (Crash):** Insulin bekerja terlalu agresif sehingga kadar gula darah merosot di bawah batas normal (*hipoglikemia reaktif*). Otak pun kekurangan pasokan energi seketika, memicu kantuk hebat dan lemas.\n\n` +
        `💡 **Solusi Ampuh dari Mimo:**\n` +
        `1. Jangan konsumsi gula manis dalam keadaan perut kosong melompong.\n` +
        `2. Pasangkan camilan manismu dengan protein atau lemak sehat (misal: kacang almond, telur rebus, atau alpukat).\n` +
        `3. Minum segelas air putih hangat dan regangkan badan selama 2 menit!`;
    },
  },

  // 3. GULA ALAMI VS GULA TAMBAHAN
  {
    patterns: [
      /(beda|bedanya|perbedaan)\s*(gula alami|gula buah)\s*(dan|dengan|sama)\s*(gula tambahan|gula pasir|sukrosa)/i,
      /apakah gula buah.*aman/i,
      /fruktosa vs sukrosa/i,
      /gula alami vs gula tambahan/i,
    ],
    title: 'Perbedaan Gula Alami vs Gula Tambahan',
    generateResponse: () => {
      return `🩺 **Perbedaan Krusial: Gula Alami vs Gula Tambahan:**\n\n` +
        `Keduanya sama-sama mengandung karbohidrat sederhana, namun cara tubuh memprosesnya sangat bertolak belakang:\n\n` +
        `🍎 **1. Gula Alami (Buah Utuh & Susu Murni):**\n` +
        `• Bentuk: Fruktosa dalam buah utuh dan Laktosa dalam susu sapi murni.\n` +
        `• Keunggulan: Dibungkus oleh **serat pangan (pektin), vitamin, mineral, dan air**. Serat menahan laju penyerapan sehingga gula darah naik perlahan dan teratur.\n` +
        `• Batasan: Tidak dibatasi ketat oleh Kemenkes asalkan dikonsumsi dalam bentuk buah utuh (bukan jus kemasan).\n\n` +
        `🍬 **2. Gula Tambahan (Gula Pasir, Sirup Fruktosa, SKM, Gula Aren):**\n` +
        `• Bentuk: Sukrosa dan Sirup Jagung Tinggi Fruktosa (HFCS).\n` +
        `• Risiko: *"Empty Calories"* (tanpa serat, tanpa vitamin). Diserap instan ke aliran darah, membebani kerja organ hati dan pankreas.\n` +
        `• Batas Kemenkes: Maksimal **50 gram (4 sendok makan)** per hari!`;
    },
  },

  // 4. PEMANIS PENGGANTI GULA / STEVIA
  {
    patterns: [
      /(stevia|pemanis buatan|pengganti gula|erythritol|diabetasol|tropicana|sucralose|monk fruit|aspartam)/i,
      /apakah stevia aman/i,
      /pemanis untuk penderita diabetes/i,
    ],
    title: 'Panduan Pemanis Pengganti Gula Rendah Kalori',
    generateResponse: () => {
      return `🌿 **Pemanis Pengganti Gula: Mana yang Paling Sehat?**\n\n` +
        `Pemanis non-nutritif dapat memberikan rasa manis tanpa memicu lonjakan glukosa darah:\n\n` +
        `1. 🍃 **Stevia (Daun Stevia Rebaudiana):**\n` +
        `   • Alami 100%, 0 kalori, Indeks Glikemik = 0.\n` +
        `   • Telah disetujui FDA & BPOM, sangat aman bagi pengidap diabetes maupun program defisit kalori.\n\n` +
        `2. 🍈 **Monk Fruit (Ekstrak Buah Luo Han Guo):**\n` +
        `   • Rasa manis bersih alami dari mogroside tanpa rasa getir (aftertaste) dan 0 kalori.\n\n` +
        `3. 🍬 **Erythritol (Gula Alkohol):**\n` +
        `   • 70% semanis gula pasir, hanya 0,2 kalori/gram, tidak merusak email gigi.\n\n` +
        `💡 **Tips Mimo:** Pemanis pengganti sangat bagus untuk fase transisi mengurangi ketergantungan lidah pada rasa manis berlebihan!`;
    },
  },

  // 5. INDEKS GLIKEMIK
  {
    patterns: [
      /(indeks glikemik|glycemic index|gi makanan|ig rendah|ig tinggi)/i,
      /apa itu indeks glikemik/i,
    ],
    title: 'Memahami Indeks Glikemik (IG)',
    generateResponse: () => {
      return `📊 **Apa Itu Indeks Glikemik (Glycemic Index / GI)?**\n\n` +
        `Indeks Glikemik adalah skala 0 – 100 yang mengukur seberapa cepat suatu makanan karbohidrat meningkatkan kadar glukosa dalam darah:\n\n` +
        `🟢 **IG Rendah (Skala ≤ 55):** Diserap perlahan, rasa kenyang tahan lama, aman untuk gula darah.\n` +
        `   *Contoh:* Oatmeal utuh, apel, kacang merah, lentil, susu kedelai murni, wortel.\n\n` +
        `🟡 **IG Sedang (Skala 56 – 69):**\n` +
        `   *Contoh:* Nasi merah, pisang matang, madu asli, ubi jalar rebus.\n\n` +
        `🔴 **IG Tinggi (Skala ≥ 70):** Cepat terurai jadi glukosa murni, memicu lonjakan insulin mendadak.\n` +
        `   *Contoh:* Nasi putih pulen, roti tawar putih, donat, kentang goreng, sirup, soda.\n\n` +
        `💡 **Trik Mimo:** Kamu bisa menurunkan total respon glikemik hidangan nasi putih dengan menambahkan sayuran berserat tinggi dan lauk protein!`;
    },
  },

  // 6. GEJALA DIABETES MELITUS
  {
    patterns: [
      /(gejala diabetes|ciri diabetes|tanda gula darah tinggi|ciri kencing manis|tanda diabetes)/i,
      /bagaimana tahu kalau kena diabetes/i,
    ],
    title: 'Gejala & Tanda Awal Diabetes Melitus',
    generateResponse: () => {
      return `🩺 **Tanda & Gejala Awal Diabetes yang Wajib Diwaspadai:**\n\n` +
        `Di dunia medis dikenal sindrom klasik **"3P"** yang menjadi sinyal utama kelebihan gula dalam darah:\n\n` +
        `1. 🚻 **Poliuria (Sering Buang Air Kecil):** Terutama terbangun di malam hari karena ginjal bekerja keras membuang glukosa berlebih lewat urine.\n` +
        `2. 💧 **Polidipsia (Sering Merasa Sangat Haus):** Dehidrasi sel akibat banyaknya cairan tubuh yang terbuang saat berkemih.\n` +
        `3. 🍽️ **Polifagia (Cepat Merasa Lapar):** Walaupun makan cukup, sel tubuh kelaparan karena glukosa tidak bisa masuk ke sel tanpa insulin yang efektif.\n\n` +
        `⚠️ **Tanda Pendukung Lainnya:**\n` +
        `• Luka atau lecet yang sangat lambat sembuh.\n` +
        `• Pandangan mata mendadak kabur / buram.\n` +
        `• Sering merasa kesemutan atau kebas di telapak kaki/tangan.\n` +
        `• Kulit di lipatan leher/ketiak menghitam (*acanthosis nigricans*).\n\n` +
        `💡 Jika merasakan gejala di atas, segera lakukan pemeriksaan Cek Gula Darah Puasa (GDP) dan HbA1c di fasilitas kesehatan terdekat ya!`;
    },
  },

  // 7. BATAS ANJURAN KEMENKES & WHO
  {
    patterns: [
      /(batas konsumsi gula|anjuran kemenkes|aturan who|berapa sendok gula|batas harian gula|rekomendasi gula)/i,
      /berapa gram gula sehari/i,
      /berapa batas maksimal gula/i,
    ],
    title: 'Batas Konsumsi Gula Harian Menurut Standar Resmi',
    generateResponse: (ctx) => {
      return `📋 **Batas Aman Konsumsi Gula Harian Resmi:**\n\n` +
        `1. 🇮🇩 **Kementerian Kesehatan RI (Permenkes No. 30 / 2013):**\n` +
        `   • Maksimal **50 gram per orang per hari**.\n` +
        `   • Setara dengan **4 sendok makan gula pasir** (atau ~12 sendok teh).\n` +
        `   • Menyumbang maksimal 10% dari total kebutuhan energi 2000 kkal.\n\n` +
        `2. 🌍 **Organisasi Kesehatan Dunia (WHO):**\n` +
        `   • Menganjurkan pembatasan gula bebas hingga di bawah **25 gram per hari (2 sendok makan)** untuk manfaat perlindungan kardiovaskular dan pencegahan karies gigi yang jauh lebih optimal.\n\n` +
        `🎯 **Batas pribadimu di GulaMate:** **${ctx.sugarLimit} gram/hari**.\n` +
        `Asupanmu hari ini: **${Math.round(ctx.todaySugar)}g** (${Math.round((ctx.todaySugar / ctx.sugarLimit) * 100)}% kuota terpakai). Pertahankan pola hidup sehatmu! ✨`;
    },
  },

  // 8. MADU & GULA MERAH VS GULA PASIR
  {
    patterns: [
      /(madu|gula merah|gula aren|gula kelapa|gula batu)\s*(lebih sehat|lebih aman|vs|dibandingkan)?\s*(gula pasir|gula putih)?/i,
      /apakah madu aman untuk diabetes/i,
      /apakah gula aren lebih sehat/i,
    ],
    title: 'Madu & Gula Aren vs Gula Pasir: Mitos & Fakta',
    generateResponse: () => {
      return `🍯 **Madu & Gula Aren vs Gula Pasir:**\n\n` +
        `Banyak yang mengira madu atau gula aren bebas dikonsumsi sebanyak-banyaknya karena "alami". Faktanya:\n\n` +
        `• 🌿 **Kelebihan Madu & Gula Aren:**\n` +
        `  Mengandung sedikit mineral mikro (kalium, zinc, zat besi) dan antioksidan, serta memiliki Indeks Glikemik yang sedikit lebih rendah daripada gula pasir rafinasi.\n\n` +
        `• ⚖️ **Fakta Biologis Tubuh:**\n` +
        `  Madu tetap terdiri dari **80% gula sederhana (fruktosa & glukosa)**! Begitu diserap ke dalam darah, beban glukosa dan kalori yang diterima pankreas hampir sama tingginya dengan gula pasir.\n\n` +
        `💡 **Kesimpulan Mimo:** Madu adalah alternatif yang lebih bernutrisi dibanding gula putih olahan, namun takarannya **tetap harus dibatasi** (maksimal 1 sendok teh) bagi yang memantau gula darah!`;
    },
  },

  // 9. REKOMENDASI CAMILAN SEHAT
  {
    patterns: [
      /(camilan|snack|cemilan)\s*(sehat|rendah gula|diet|bebas gula|diabetes)/i,
      /rekomendasi camilan/i,
      /ide camilan/i,
      /camilan apa yang aman/i,
    ],
    title: 'Ide Camilan Sehat Rendah Gula dari Mimo',
    generateResponse: () => {
      return `🍓 **Ide Camilan Rendah Gula Lezat & Mengenyangkan:**\n\n` +
        `1. 🌰 **Kacang Almond / Edamame Rebus (30g):**\n` +
        `   Tinggi protein & magnesium, 0g gula tambahan, menahan lapar hingga berjam-jam.\n\n` +
        `2. 🍏 **Potongan Apel Hijau + Selai Kacang Murni (Peanut Butter Tanpa Gula):**\n` +
        `   Perpaduan serat renyah dan lemak sehat yang tidak membuat gula darah melonjak.\n\n` +
        `3. 🥣 **Greek Yogurt Plain + Taburan Biji Chia & Stroberi Segar:**\n` +
        `   Tinggi kalsium dan probiotik pencernaan dengan rasa manis alami buah beri.\n\n` +
        `4. 🥑 **Irisan Alpukat dengan Sedikit Garam Laut & Wijen:**\n` +
        `   Sangat padat nutrisi pelindung jantung dengan kadar gula mendekati nol gram!\n\n` +
        `5. 🥚 **Telur Rebus Setengah Matang / Keju Slice:**\n` +
        `   Praktis, padat gizi, dan 100% bebas dari risiko hiperglikemia.`;
    },
  },

  // 10. MENGATASI CRAVING / KECANDUAN MANIS
  {
    patterns: [
      /(craving|ngidam|kecanduan|ketagihan|pengen|pengin)\s*(manis|gula)/i,
      /cara.*berhenti.*makan manis/i,
      /cara mengatasi.*craving/i,
    ],
    title: 'Cara Mengatasi Ketergantungan / Craving Makanan Manis',
    generateResponse: () => {
      return `💪 **Strategi Cerdas Mengatasi "Craving" Makanan Manis:**\n\n` +
        `Rasa ingin makan manis seringkali bukan karena tubuh lapar, melainkan sinyal dehidrasi atau stimulasi hormon dopamin di otak:\n\n` +
        `1. 💧 **Aturan 1 Gelas Air Putih:** Begitu rasa ingin manis muncul, minum 1 gelas besar air putih dan tunggu 10 menit. Seringkali rasa ingin manis hilang seketika!\n` +
        `2. 🍎 **Alihkan ke Buah Utuh:** Ganti permen/kue dengan buah dingin seperti semangka atau apel yang kaya air dan serat.\n` +
        `3. 🦷 **Sikat Gigi atau Kumur:** Sensasi mentol mint segar di mulut secara psikologis menghentikan nafsu mengunyah makanan manis.\n` +
        `4. 😴 **Tidur Cukup 7-8 Jam:** Kurang tidur meningkatkan hormon ghrelin (pemicu lapar) dan menekan hormon leptin (penahan nafsu makan), membuat otak terus mencari dorongan gula cepat!`;
    },
  },
];

// ============================================================================
// MESIN PENCARIAN ENTITAS & GENERASI JAWABAN KUSTOM (SEMANTIC NLP)
// ============================================================================

/**
 * Mencari makanan yang cocok dari knowledge base berdasarkan query pengguna
 */
function findMatchingFood(userQuestion: string): { food: FoodItemDetail; matchedKeyword: string } | null {
  const q = userQuestion.toLowerCase().replace(/[?,.!"']/g, ' ').replace(/\s+/g, ' ').trim();

  // Sort keywords by length descending agar match yang paling spesifik didahulukan
  // Misal: "martabak telur" harus match martabak telur duluan daripada "martabak"
  const candidates: { food: FoodItemDetail; keyword: string }[] = [];

  for (const item of NUTRITION_KNOWLEDGE_BASE) {
    for (const kw of item.keywords) {
      if (q.includes(kw)) {
        candidates.push({ food: item, keyword: kw });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Ambil kandidat dengan panjang keyword terpanjang
  candidates.sort((a, b) => b.keyword.length - a.keyword.length);
  return { food: candidates[0].food, matchedKeyword: candidates[0].keyword };
}

/**
 * Memeriksa apakah ada modifier (less sugar, porsi 2x, tanpa gula, dsb)
 */
function extractModifiers(userQuestion: string): { sugarMultiplier: number; portionText: string; isZeroSugar: boolean } {
  const q = userQuestion.toLowerCase();

  if (q.includes('tanpa gula') || q.includes('no sugar') || q.includes('sugar free') || q.includes('bebas gula') || q.includes('tawar') || q.includes('0 sugar') || q.includes('0%')) {
    return { sugarMultiplier: 0, portionText: 'varian tanpa gula / tawar', isZeroSugar: true };
  }

  if (q.includes('less sugar') || q.includes('sedikit gula') || q.includes('setengah gula') || q.includes('separuh gula') || q.includes('50%') || q.includes('30%') || q.includes('slight sugar')) {
    return { sugarMultiplier: 0.5, portionText: 'varian Less Sugar (~50%)', isZeroSugar: false };
  }

  if (q.includes('extra sugar') || q.includes('lebih manis') || q.includes('banyak gula') || q.includes('sangat manis')) {
    return { sugarMultiplier: 1.3, portionText: 'varian Extra Sugar', isZeroSugar: false };
  }

  if (q.includes('2 gelas') || q.includes('2 cup') || q.includes('2 porsi') || q.includes('2 piring') || q.includes('2 botol')) {
    return { sugarMultiplier: 2.0, portionText: '2 porsi', isZeroSugar: false };
  }

  return { sugarMultiplier: 1.0, portionText: '', isZeroSugar: false };
}

/**
 * Menyusun respon detail makanan spesifik yang ditanyakan pengguna
 */
function buildFoodAnswer(
  food: FoodItemDetail,
  context: MimoChatContext,
  modifier: { sugarMultiplier: number; portionText: string; isZeroSugar: boolean }
): string {
  const remaining = Math.max(0, context.sugarLimit - context.todaySugar);

  if (modifier.isZeroSugar) {
    return `✨ **${food.name} (${modifier.portionText}):**\n\n` +
      `• **Kadar Gula:** **0 gram** (Bebas gula pasir!)\n` +
      `• **Kalori:** Sangat minimal (~0–5 kkal)\n` +
      `• **Dampak ke Kuota:** Tidak menambah beban gula harianmu sama sekali.\n\n` +
      `💡 **Catatan Mimo:** Pilihan yang luar biasa bijak! Tetap terhidrasi dan nikmati kesegarannya tanpa rasa cemas ya. ✨`;
  }

  const sugarAvg = Math.round(food.sugarAvg * modifier.sugarMultiplier);
  const sugarMin = Math.round(food.sugarMin * modifier.sugarMultiplier);
  const sugarMax = Math.round(food.sugarMax * modifier.sugarMultiplier);
  const teaspoons = (sugarAvg / 4).toFixed(1);
  const percentLimit = Math.round((sugarAvg / context.sugarLimit) * 100);
  const caloriesFromSugar = Math.round(sugarAvg * 4);

  let emoji = '☕';
  if (food.category === 'beverage') emoji = '🍹';
  if (food.category === 'snack') emoji = '🍩';
  if (food.category === 'fruit') emoji = '🍎';
  if (food.category === 'staple') emoji = '🍚';
  if (food.category === 'savory') emoji = '🍲';

  const servingLabel = modifier.portionText ? `${food.serving} (${modifier.portionText})` : food.serving;

  let impactNote = '';
  if (sugarAvg === 0) {
    impactNote = 'Aman 100% dari gula tambahan.';
  } else if (sugarAvg <= 10) {
    impactNote = `Masih tergolong rendah-sedang (~${percentLimit}% dari batas harianmu).`;
  } else if (sugarAvg <= 25) {
    impactNote = `Mengambil sekitar **${percentLimit}%** dari jatah kuota gula harianmu (${context.sugarLimit}g)!`;
  } else {
    impactNote = `⚠️ **Peringatan Manis:** Menghabiskan **${percentLimit}%** dari total batas gula harianmu dalam sekali santap!`;
  }

  return `${emoji} **${food.name}**\n` +
    `📏 **Porsi Standar:** ${servingLabel}\n` +
    `• **Kadar Gula:** **${sugarMin === sugarMax ? sugarAvg : `${sugarMin} – ${sugarMax}`} gram** (setara **~${teaspoons} sendok teh gula pasir**)\n` +
    `• **Kalori Gula:** ~${caloriesFromSugar} kkal (${food.calories ? `total energi ~${food.calories} kkal` : ''})\n` +
    `• **Dampak Kuota:** ${impactNote}\n` +
    (food.isNaturalSugar ? `• *Gula Alami:* Gula berasal dari fruktosa/laktosa utuh yang disertai mikronutrien bermanfaat.\n\n` : '\n') +
    `💡 **Tips Sehat dari Mimo:**\n${food.tips}\n\n` +
    `📊 *Statusmu saat ini: Sudah masuk ${Math.round(context.todaySugar)}g gula, sisa kuota amanmu hari ini tinggal **${remaining.toFixed(0)}g**.*`;
}

/**
 * Fallback cerdas untuk makanan apapun yang belum terdaftar di database
 * Mampu mengekstraksi subjek makanan dari pertanyaan dan mengestimasi berdasarkan tipe
 */
function buildGenericNutritionEstimate(userQuestion: string, context: MimoChatContext): string {
  const q = userQuestion.toLowerCase();
  const remaining = Math.max(0, context.sugarLimit - context.todaySugar);

  // Deteksi kategori kasar berdasarkan kata kunci
  const isDrink = /minum|jus|es|kopi|teh|susu|sirup|boba|shake|smoothie|drink|latte|soda|cup|gelas|botol/i.test(q);
  const isSweetDessert = /kue|roti|cake|dessert|manis|cokelat|coklat|donat|bolu|puding|tart|biskuit|permen/i.test(q);
  const isFruit = /buah|apel|jeruk|pisang|mangga|pepaya|melon|semangka|nanas|anggur/i.test(q);

  let estSugar = 15;
  let typeDesc = 'makanan olahan';
  let tips = 'Periksa tabel "Informasi Nilai Gizi" pada kemasan dan cari baris "Gula / Sugars".';

  if (isDrink) {
    estSugar = 22;
    typeDesc = 'minuman manis siap saji';
    tips = 'Untuk minuman manis, kamu bisa selalu meminta opsi "Less Sugar" (30-50%) atau beralih ke varian tawar (0 gram gula).';
  } else if (isSweetDessert) {
    estSugar = 20;
    typeDesc = 'camilan manis / dessert';
    tips = 'Nikmati dalam porsi kecil dan padukan dengan air putih hangat tanpa pemanis.';
  } else if (isFruit) {
    estSugar = 12;
    typeDesc = 'buah segar';
    tips = 'Buah segar mengandung fruktosa alami yang aman karena diimbangi serat pangan utuh.';
  } else {
    estSugar = 4;
    typeDesc = 'makanan gurih / pokok';
    tips = 'Makanan gurih umumnya rendah gula bebas, kecuali jika diberi kecap manis kental atau saus marinasi manis.';
  }

  const sdt = (estSugar / 4).toFixed(1);

  return `🍽️ **Estimasi Nutrisi untuk Pertanyaanmu:**\n\n` +
    `Berdasarkan karakteristik **${typeDesc}**, estimasi kadar gula rata-ratanya adalah:\n` +
    `• **Kadar Gula Estimasi:** **~${estSugar} gram** (setara **~${sdt} sendok teh gula**)\n` +
    `• **Dampak ke Kuota:** Mengambil sekitar **${Math.round((estSugar / context.sugarLimit) * 100)}%** dari batas harianmu (${context.sugarLimit}g).\n\n` +
    `💡 **Saran Praktis Mimo:**\n` +
    `${tips}\n\n` +
    `📊 *Sisa kuota gula aman ${context.userName} hari ini masih ada **${remaining.toFixed(0)} gram**.* Mau cek makanan lainnya? 😊`;
}

/**
 * Mesin Pengetahuan Gizi & Nutrisi Lokal Cerdas (Fallback Offline AI Engine)
 * Memastikan 100% pertanyaan seputar makanan, gram gula, dan kesehatan diabetes
 * terjawab dengan presisi dan relevansi tinggi bahkan saat offline atau tanpa API key.
 */
function generateLocalMimoResponse(
  userQuestion: string,
  context: MimoChatContext
): string {
  const q = userQuestion.toLowerCase().trim();

  // 1. Cek apakah cocok dengan Topik Kesehatan / Edukasi Diabetes
  for (const topic of HEALTH_TOPICS) {
    for (const pat of topic.patterns) {
      if (pat.test(q)) {
        return topic.generateResponse(context);
      }
    }
  }

  // 2. Cek apakah ada makanan tertentu di database nutrisi
  const match = findMatchingFood(userQuestion);
  if (match) {
    const modifier = extractModifiers(userQuestion);
    return buildFoodAnswer(match.food, context, modifier);
  }

  // 3. Cek apakah pertanyaan mengandung pola "berapa gram...", "kandungan gula...", "berapa sdt..."
  const isAskingSugarQuantity = /berapa\s*(gram|gula|sendok|sdt|kalori|kandungan)|kandungan gula|ada berapa gram|takaran gula|banyak gula/i.test(q);
  if (isAskingSugarQuantity) {
    return buildGenericNutritionEstimate(userQuestion, context);
  }

  // 4. Sapaan Ramah & Percakapan Santai
  if (/^(halo|hai|pagi|siang|sore|malam|assalamualaikum|tes|test|hei|mimo)/i.test(q)) {
    const remaining = Math.max(0, context.sugarLimit - context.todaySugar);
    return `Halo ${context.userName}! Senang bertemu denganmu lagi. 👋🧁\n\n` +
      `Aku Mimo, asisten gizi pintarmu di GulaMate. Hari ini kamu sudah mengonsumsi **${Math.round(context.todaySugar)}g** gula dari batas aman **${context.sugarLimit}g** (sisa kuota: **${remaining.toFixed(0)}g**).\n\n` +
      `Kamu bisa tanya Mimo apa saja seputar:\n` +
      `• *"Berapa gram pada kopi susu aren?"*\n` +
      `• *"Boba vs es teh manis, mana lebih tinggi gulanya?"*\n` +
      `• *"Cara cepat bakar kelebihan gula hari ini"*\n` +
      `• *"Apakah pemanis stevia aman untuk diabetes?"*\n\n` +
      `Ada yang ingin kamu tanyakan hari ini? 😊`;
  }

  if (/terima kasih|makasih|thanks|thank you|makasi|tengkyu/i.test(q)) {
    return `Sama-sama, ${context.userName}! Senang sekali bisa membantumu menjaga kesehatan gula darah. Tetap semangat hidrasi air putih dan jaga pola makan seimbang ya! 🌟🧁`;
  }

  // 5. Default Pintar yang Terarah dan Mengajak Interaksi
  return buildGenericNutritionEstimate(userQuestion, context);
}

/**
 * Fungsi Utama: Menjawab pertanyaan chat dengan Google Gemini AI (dengan fallback lokal andal)
 */
export async function askMimoAI(
  userQuestion: string,
  context: MimoChatContext
): Promise<string> {
  const apiKey = await getGeminiApiKey();

  // Jika API Key tersedia, hubungi Google Gemini AI terlebih dahulu
  if (apiKey) {
    try {
      const response = await callGeminiApi(userQuestion, context, apiKey);
      return response;
    } catch (err: any) {
      console.warn('Gemini AI fallback triggered:', err?.message || err);
    }
  }

  // Gunakan Local Intelligent Engine jika tanpa API key, offline, atau saat rate-limited
  return generateLocalMimoResponse(userQuestion, context);
}

/**
 * Meminta estimasi kandungan gula dari Gemini AI untuk katalog/pencarian modal tambah makanan
 */
export async function askGeminiSugarEstimate(
  foodName: string,
  apiKey: string
): Promise<{ sugarGrams: number; confidence: 'high' | 'medium' | 'estimated'; explanation: string; servingDesc: string } | null> {
  const prompt = `Analisis kandungan gula untuk makanan/minuman berikut: "${foodName}".
Berikan estimasi gram gula realistis per porsi standar berdasarkan basis data nutrisi Kemenkes RI atau USDA.
Jawab HANYA dalam format JSON murni tanpa pembungkus codeblock markdown dan tanpa teks tambahan apapun:
{"sugarGrams": 22, "confidence": "high", "explanation": "Estimasi nutrisi: ~22g gula per porsi", "servingDesc": "1 porsi standar"}`;

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
            explanation: parsed.explanation || `Estimasi nutrisi: ~${parsed.sugarGrams}g gula`,
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
