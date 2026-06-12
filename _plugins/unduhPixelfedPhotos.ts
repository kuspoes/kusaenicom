// simple_download.ts (pakai nama asli, limit 8 gambar)
const FEED_URL = "https://pixelfed.social/users/poes.atom";
const OUTPUT_DIR = "./_src/assets/pixelfed";
const MAX_IMAGES = 8;

await Deno.mkdir(OUTPUT_DIR, { recursive: true });

// Ambil feed
console.log(`📡 Mengambil feed: ${FEED_URL}`);
const feedResponse = await fetch(FEED_URL);
if (!feedResponse.ok) {
  console.error(`❌ Gagal mengambil feed: ${feedResponse.status}`);
  Deno.exit(1);
}

const feed = await feedResponse.text();

// Extract semua URL gambar (regex sederhana)
const urls = feed.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png)/gi) || [];
const uniqueUrls = [...new Set(urls)];

console.log(`📸 Ditemukan ${uniqueUrls.length} gambar total`);

// Filter URL yang mengandung "avatar" (case-insensitive)
const filteredUrls = uniqueUrls.filter((url) =>
  !url.toLowerCase().includes("avatar")
);

const skippedCount = uniqueUrls.length - filteredUrls.length;
console.log(`🚫 Melewati ${skippedCount} gambar avatar`);
console.log(`📥 Tersedia ${filteredUrls.length} gambar (bukan avatar)`);

// Batasi maksimal 8 gambar
const limitedUrls = filteredUrls.slice(0, MAX_IMAGES);
console.log(`🎯 Akan mendownload ${limitedUrls.length} gambar\n`);

// Download satu per satu (pakai nama file asli)
let successCount = 0;
let failCount = 0;

for (let i = 0; i < limitedUrls.length; i++) {
  const url = limitedUrls[i];

  // Ambil nama file dari URL (yang sudah random dari Pixelfed)
  let filename = url.split("/").pop() || `image_${i}.jpg`;
  // Bersihkan dari query string (jika ada ?xxx)
  filename = filename.split("?")[0];

  const filepath = `${OUTPUT_DIR}/${filename}`;

  // Cek apakah file sudah ada
  try {
    await Deno.stat(filepath);
    console.log(
      `[${i + 1}/${limitedUrls.length}] ⏭️  Skip (sudah ada): ${filename}`,
    );
    successCount++;
    continue;
  } catch {
    // File belum ada, lanjut download
  }

  try {
    console.log(`[${i + 1}/${limitedUrls.length}] 📥 Download: ${filename}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    await Deno.writeFile(filepath, new Uint8Array(buffer));

    // Hitung ukuran file
    const sizeKB = (buffer.byteLength / 1024).toFixed(2);
    console.log(`   ✅ Berhasil (${sizeKB} KB)`);
    successCount++;
  } catch (error) {
    console.log(`   ❌ Gagal: ${error.message}`);
    failCount++;
  }

  // Jeda singkat agar tidak membebani server
  await new Promise((resolve) => setTimeout(resolve, 200));
}

// Ringkasan
console.log("\n" + "=".repeat(50));
console.log(`✨ Selesai!`);
console.log(`   Total gambar ditemukan: ${uniqueUrls.length}`);
console.log(`   Dilewati (avatar): ${skippedCount}`);
console.log(`   Batas maksimal: ${MAX_IMAGES}`);
console.log(`   Berhasil diproses: ${successCount}`);
console.log(`   Gagal: ${failCount}`);
console.log(`   Lokasi: ${OUTPUT_DIR}`);
console.log("=".repeat(50));
