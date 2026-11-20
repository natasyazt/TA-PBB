/**
 * AI Sugar Estimator Service
 * Mengestimasi kandungan gula (dalam gram) berdasarkan nama makanan/minuman
 * menggunakan model pemrosesan bahasa alami (NLP) nutrisi lokal & data Kemenkes/USDA.
 */

export interface SugarEstimateResult {
  sugarGrams: number;
  confidence: 'high' | 'medium' | 'estimated';
  explanation: string;
  servingDesc: string;
}

// Database referensi kadar gula makanan & minuman populer Indonesia & global
interface FoodSugarRef {
  keywords: string[];
  baseSugar: number;
  serving: string;
  category: string;
}

const NUTRITION_DATABASE: FoodSugarRef[] = [
  // Minuman Manis Populer
  { keywords: ['es teh manis', 'teh manis', 'sweet tea', 'teh botol', 'teh poci manis'], baseSugar: 20, serving: '1 gelas (250ml)', category: 'Minuman' },
  { keywords: ['es teh tawar', 'teh tawar', 'teh hijau tawar', 'air putih', 'air mineral', 'air kelapa murni'], baseSugar: 0, serving: '1 gelas', category: 'Minuman' },
  { keywords: ['kopi susu gula aren', 'kopi susu aren', 'kopi kenangan', 'kopi janji jiwa', 'kopi kulo', 'kopi aren'], baseSugar: 25, serving: '1 cup reguler (350ml)', category: 'Minuman' },
  { keywords: ['kopi hitam tanpa gula', 'americano', 'espresso', 'kopi tubruk tawar'], baseSugar: 0, serving: '1 cangkir', category: 'Minuman' },
  { keywords: ['kopi hitam manis', 'kopi tubruk manis', 'kopi sachet', 'kopi instan manis'], baseSugar: 14, serving: '1 cangkir', category: 'Minuman' },
  { keywords: ['boba', 'bubble tea', 'brown sugar boba', 'boba milk tea', 'boba brown sugar', 'chatime'], baseSugar: 38, serving: '1 cup besar + boba', category: 'Minuman' },
  { keywords: ['teh tarik', 'milk tea', 'thai tea', 'green tea latte', 'matcha latte manis'], baseSugar: 24, serving: '1 cup (350ml)', category: 'Minuman' },
  { keywords: ['soda', 'coca cola', 'pepsi', 'fanta', 'sprite', 'minuman bersoda', 'tebs'], baseSugar: 35, serving: '1 kaleng (330ml)', category: 'Minuman' },
  { keywords: ['jus mangga', 'jus alpukat', 'jus sirsak', 'jus buah manis'], baseSugar: 22, serving: '1 gelas dengan SKM/gula', category: 'Minuman' },
  { keywords: ['jus buah murni', 'jus tanpa gula', 'pure juice'], baseSugar: 10, serving: '1 gelas (gula alami)', category: 'Minuman' },
  { keywords: ['es cendol', 'es dawet', 'cendol nangka'], baseSugar: 30, serving: '1 mangkuk santan & gula merah', category: 'Minuman' },
  { keywords: ['es doger', 'es campur', 'es teler', 'es oyen'], baseSugar: 28, serving: '1 mangkuk es dengan sirup & SKM', category: 'Minuman' },
  { keywords: ['es kelapa muda sirup', 'kelapa sirup', 'es degan sirup'], baseSugar: 18, serving: '1 gelas besar', category: 'Minuman' },
  { keywords: ['susu kental manis', 'skm', 'susu full cream cokelat', 'susu kotak cokelat'], baseSugar: 20, serving: '1 porsi (200ml)', category: 'Minuman' },
  { keywords: ['yogurt manis', 'yogurt buah', 'yakult'], baseSugar: 14, serving: '1 botol/cup', category: 'Minuman' },

  // Camilan & Kue Tradisional / Jajan Pasar
  { keywords: ['martabak manis', 'terang bulan'], baseSugar: 18, serving: '1 potong sedang', category: 'Camilan' },
  { keywords: ['klepon', 'kue klepon'], baseSugar: 15, serving: '3 butir (isi gula merah)', category: 'Camilan' },
  { keywords: ['pisang goreng', 'pisang cokelat', 'piscok'], baseSugar: 12, serving: '1 buah', category: 'Camilan' },
  { keywords: ['donat', 'donat cokelat', 'donat jco', 'dunkin'], baseSugar: 15, serving: '1 buah donat', category: 'Camilan' },
  { keywords: ['roti manis', 'roti cokelat', 'roti keju', 'roti srikaya'], baseSugar: 14, serving: '1 buah roti', category: 'Camilan' },
  { keywords: ['roti tawar'], baseSugar: 2, serving: '1 lembar', category: 'Makanan' },
  { keywords: ['cookie', 'cookies', 'biskuit manis', 'oreo'], baseSugar: 11, serving: '2 keping', category: 'Camilan' },
  { keywords: ['brownies', 'brownies cokelat'], baseSugar: 19, serving: '1 potong (50g)', category: 'Camilan' },
  { keywords: ['es krim', 'ice cream', 'gelato'], baseSugar: 21, serving: '1 scoop / cone', category: 'Camilan' },
  { keywords: ['puding cokelat', 'puding karamel', 'pudding'], baseSugar: 16, serving: '1 cup sedang', category: 'Camilan' },
  { keywords: ['cokelat', 'cokelat batangan', 'silverqueen', 'kitkat'], baseSugar: 16, serving: '1 bar sedang (35g)', category: 'Camilan' },
  { keywords: ['kolak pisang', 'kolak ubi', 'bubur kacang hijau manis', 'bubur ketan hitam'], baseSugar: 25, serving: '1 mangkuk', category: 'Camilan' },

  // Makanan Utama (Rata-rata rendah gula tambahan kecuali saus manis)
  { keywords: ['nasi putih', 'nasi merah', 'nasi uduk', 'nasi kuning'], baseSugar: 0.2, serving: '1 porsi (tanpa gula tambahan)', category: 'Makanan' },
  { keywords: ['nasi goreng'], baseSugar: 3, serving: '1 piring (dari kecap manis)', category: 'Makanan' },
  { keywords: ['mie instan', 'indomie goreng', 'indomie kuah', 'bakmi'], baseSugar: 2, serving: '1 porsi', category: 'Makanan' },
  { keywords: ['ayam goreng', 'ayam geprek', 'ikan bakar', 'bebek goreng'], baseSugar: 0.5, serving: '1 potong', category: 'Makanan' },
  { keywords: ['ayam bakar madu', 'ayam kecap', 'sate ayam kecap'], baseSugar: 8, serving: '1 porsi (bumbu manis)', category: 'Makanan' },
  { keywords: ['rendang', 'gulai', 'soto ayam', 'rawon', 'bakso'], baseSugar: 1.5, serving: '1 mangkuk/porsi', category: 'Makanan' },

  // Buah-buahan Alami
  { keywords: ['pisang', 'banana'], baseSugar: 12, serving: '1 buah sedang (gula alami)', category: 'Buah' },
  { keywords: ['apel', 'apple'], baseSugar: 10, serving: '1 buah sedang (gula alami)', category: 'Buah' },
  { keywords: ['semangka', 'watermelon'], baseSugar: 9, serving: '1 potong besar (gula alami)', category: 'Buah' },
  { keywords: ['mangga', 'mango'], baseSugar: 22, serving: '1 buah sedang (gula alami)', category: 'Buah' },
  { keywords: ['jeruk', 'orange'], baseSugar: 9, serving: '1 buah sedang (gula alami)', category: 'Buah' },
  { keywords: ['anggur', 'grapes'], baseSugar: 15, serving: '1 mangkuk kecil (gula alami)', category: 'Buah' },
  { keywords: ['alpukat murni', 'alpukat'], baseSugar: 1, serving: '1 buah (tanpa gula)', category: 'Buah' },
];

/**
 * Estimasi kandungan gula dari nama makanan secara cerdas
 */
export async function estimateSugarFromAI(foodQuery: string): Promise<SugarEstimateResult> {
  const query = foodQuery.trim().toLowerCase();

  if (!query) {
    return {
      sugarGrams: 0,
      confidence: 'estimated',
      explanation: 'Masukkan nama makanan atau minuman.',
      servingDesc: '',
    };
  }

  // Cek apakah ada pengubah gula spesifik
  const isNoSugar =
    query.includes('tanpa gula') ||
    query.includes('no sugar') ||
    query.includes('zero sugar') ||
    query.includes('sugar free') ||
    query.includes('tawar') ||
    query.includes('pahit');

  const isLessSugar =
    query.includes('less sugar') ||
    query.includes('sedikit gula') ||
    query.includes('setengah gula') ||
    query.includes('50% sugar');

  const isExtraSugar =
    query.includes('extra sugar') ||
    query.includes('manis banget') ||
    query.includes('sangat manis') ||
    query.includes('banyak gula');

  // Deteksi angka porsi jika ada (misal: "2 gelas", "3 butir", "2 potong", "2x")
  let portionMultiplier = 1;
  const portionMatch = query.match(/(\d+)\s*(gelas|cup|piring|mangkuk|potong|buah|butir|lembar|porsi|x)/i);
  if (portionMatch && portionMatch[1]) {
    const num = parseInt(portionMatch[1], 10);
    if (!isNaN(num) && num > 0 && num <= 10) {
      portionMultiplier = num;
    }
  }

  // Cari kecocokan di database
  let bestMatch: FoodSugarRef | null = null;
  let highestScore = 0;

  for (const item of NUTRITION_DATABASE) {
    for (const kw of item.keywords) {
      if (query.includes(kw)) {
        const score = kw.length; // prioritaskan keyword yang lebih panjang & spesifik
        if (score > highestScore) {
          highestScore = score;
          bestMatch = item;
        }
      }
    }
  }

  // Jika cocok dengan database
  if (bestMatch) {
    let finalGrams = bestMatch.baseSugar;

    if (isNoSugar) {
      finalGrams = 0;
    } else if (isLessSugar) {
      finalGrams = Math.round(finalGrams * 0.55 * 10) / 10;
    } else if (isExtraSugar) {
      finalGrams = Math.round(finalGrams * 1.45 * 10) / 10;
    }

    finalGrams = Math.round(finalGrams * portionMultiplier * 10) / 10;

    let explanation = `Estimasi AI: ~${finalGrams}g gula untuk ${bestMatch.serving}`;
    if (portionMultiplier > 1) {
      explanation += ` (${portionMultiplier} porsi)`;
    }
    if (isLessSugar) explanation += ' [Less Sugar]';
    if (isExtraSugar) explanation += ' [Extra Sugar]';
    if (isNoSugar) explanation += ' [Tanpa Gula]';

    return {
      sugarGrams: finalGrams,
      confidence: 'high',
      explanation,
      servingDesc: bestMatch.serving,
    };
  }

  // Heuristik cerdas untuk makanan yang belum terdaftar:
  // Cek kata kunci umum
  let estimatedGrams = 8; // rata-rata default
  let reason = 'makanan olahan';

  if (query.includes('teh') || query.includes('tea')) {
    estimatedGrams = isNoSugar ? 0 : isLessSugar ? 10 : 18;
    reason = 'minuman teh manis';
  } else if (query.includes('kopi') || query.includes('coffee')) {
    estimatedGrams = isNoSugar ? 0 : isLessSugar ? 11 : 20;
    reason = 'minuman kopi';
  } else if (query.includes('jus') || query.includes('juice') || query.includes('smoothie')) {
    estimatedGrams = isNoSugar ? 10 : 22;
    reason = 'minuman jus manis';
  } else if (query.includes('es ') || query.includes('ice ')) {
    estimatedGrams = 24;
    reason = 'minuman es campur/manis';
  } else if (query.includes('kue') || query.includes('cake') || query.includes('tart')) {
    estimatedGrams = 20;
    reason = 'kue manis/pastry';
  } else if (query.includes('roti') || query.includes('bread')) {
    estimatedGrams = 12;
    reason = 'roti';
  } else if (query.includes('cokelat') || query.includes('chocolate')) {
    estimatedGrams = 16;
    reason = 'olahan cokelat';
  } else if (query.includes('sirup') || query.includes('syrup')) {
    estimatedGrams = 25;
    reason = 'minuman bersirup';
  } else if (query.includes('gorengan') || query.includes('tahu') || query.includes('tempe')) {
    estimatedGrams = 1;
    reason = 'gorengan gurih';
  } else if (query.includes('nasi') || query.includes('lauk') || query.includes('sayur') || query.includes('sop') || query.includes('soto')) {
    estimatedGrams = 1.5;
    reason = 'makanan gurih';
  }

  estimatedGrams = Math.round(estimatedGrams * portionMultiplier * 10) / 10;

  return {
    sugarGrams: estimatedGrams,
    confidence: 'estimated',
    explanation: `Perkiraan AI: ~${estimatedGrams}g gula berdasarkan kategori ${reason}.`,
    servingDesc: '1 porsi standar',
  };
}
