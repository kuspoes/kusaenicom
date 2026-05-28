// jalankan dengan deno run -A _plugins/pixelfed.ts
// script ini tidak jalan otomatis, jadi jalankan manual sebelum build
// ini akan fetch atom dan simpan URL media ke dalam file pixelfed.json
// bisa dipanggil dengan lume sebagai shared data.
// tapi karena json, maka manggilnya lebih aman pakai java/typescript
// contoh {{ for photos of pixelfed }} {{ photos.url }} {{ /for }}

interface PixelfedPhoto {
  url: string;
  thumb: string;
  link: string;
  title: string;
  published: string;
}

async function fetchAndSave() {
  const atomUrl = "https://pixelfed.social/users/poes.atom";
  const outputPath = "./_src/_data/pixelfed.json";
  const limit = 9;

  console.log("📡 Ambil data RSS/Atom dari Pixelfed...");

  try {
    await Deno.mkdir("./_src/_data", { recursive: true });

    const res = await fetch(atomUrl);
    const text = await res.text();

    const entries = text.split(/<entry>/);
    const photos: PixelfedPhoto[] = [];

    for (let i = 1; i < entries.length && photos.length < limit; i++) {
      const entry = entries[i];

      const mediaMatch = entry.match(/<media:content\s+url="([^"]+)"/);
      const linkMatch = entry.match(/<link[^>]+href="([^"]+)"/);
      const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
      const updatedMatch = entry.match(/<updated>([^<]+)<\/updated>/);

      if (mediaMatch) {
        const fullUrl = mediaMatch[1];

        let thumbUrl = fullUrl;

        if (fullUrl.match(/\.(jpg|jpeg|png|webp)/i)) {
          // pixelfed kasih gambar full reslusi ini bini LCP bakal teriak - teriak karena
          // akses situs makin lambat, tapi ada rahasia kalo pixelfed kasih gambar versi thumbnail
          // jadi perlu nambah _thumb di akhir nama file.
          // soal LCP bodo amat lah, nanti bakalan dicache sama cloudflare
          thumbUrl = fullUrl.replace(/\.(jpg|jpeg|png|webp)$/i, "_thumb.jpg");
        } else {
          thumbUrl = fullUrl + "_thumb.jpg";
        }

        photos.push({
          url: fullUrl,
          thumb: thumbUrl,
          link: linkMatch?.[1] ?? "#",
          title: titleMatch?.[1]?.trim() ?? "Pixelfed photo",
          published: updatedMatch?.[1] ?? new Date().toISOString(),
        });
      }
    }

    await Deno.writeTextFile(outputPath, JSON.stringify(photos, null, 2));
    console.log(`✅ Simpan ${photos.length} photos ke ${outputPath}`);

    if (photos.length > 0) {
      console.log("\n📸 Hasilnya:");
      photos.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title.substring(0, 40)}`);
        console.log(`     Full: ${p.url.substring(0, 80)}...`);
        console.log(`     Thumb: ${p.thumb.substring(0, 80)}...`);
      });
    }
  } catch (error) {
    console.error("❌ Gawat! : ", error);
    Deno.exit(1);
  }
}

await fetchAndSave();
