// scripts/fetch-pixelfed.ts

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

  console.log("📡 Fetching from Pixelfed Atom feed...");

  try {
    await Deno.mkdir("./_src/_data", { recursive: true });

    const res = await fetch(atomUrl);
    const text = await res.text();

    const entries = text.split(/<entry>/);
    const photos: PixelfedPhoto[] = [];

    for (let i = 1; i < entries.length && photos.length < limit; i++) {
      const entry = entries[i];

      // Ambil URL full dari media:content
      const mediaMatch = entry.match(/<media:content\s+url="([^"]+)"/);
      const linkMatch = entry.match(/<link[^>]+href="([^"]+)"/);
      const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
      const updatedMatch = entry.match(/<updated>([^<]+)<\/updated>/);

      if (mediaMatch) {
        const fullUrl = mediaMatch[1];

        // 🔧 Generate thumbnail URL (tambah _thumb.jpg)
        let thumbUrl = fullUrl;

        // Cek ekstensi file
        if (fullUrl.match(/\.(jpg|jpeg|png|webp)/i)) {
          // Hapus ekstensi yang ada, tambah _thumb.jpg
          thumbUrl = fullUrl.replace(/\.(jpg|jpeg|png|webp)$/i, "_thumb.jpg");
        } else {
          // Kalau ga ada ekstensi, langsung tambah _thumb.jpg
          thumbUrl = fullUrl + "_thumb.jpg";
        }

        photos.push({
          url: fullUrl, // Full size untuk lightbox
          thumb: thumbUrl, // Thumbnail untuk grid
          link: linkMatch?.[1] ?? "#",
          title: titleMatch?.[1]?.trim() ?? "Pixelfed photo",
          published: updatedMatch?.[1] ?? new Date().toISOString(),
        });
      }
    }

    await Deno.writeTextFile(outputPath, JSON.stringify(photos, null, 2));
    console.log(`✅ Saved ${photos.length} photos to ${outputPath}`);

    if (photos.length > 0) {
      console.log("\n📸 Preview:");
      photos.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title.substring(0, 40)}`);
        console.log(`     Full: ${p.url.substring(0, 80)}...`);
        console.log(`     Thumb: ${p.thumb.substring(0, 80)}...`);
      });
    }
  } catch (error) {
    console.error("❌ Failed:", error);
    Deno.exit(1);
  }
}

await fetchAndSave();
