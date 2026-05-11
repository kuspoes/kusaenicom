---
comment: false
templateEngine: vto, md
title: "Test untuk masonry"
draft: true
---

{{ comp.img_masonry({
  images: [
    { src: "https://placehold.co/1600x1200/d8e2dc/22223b", alt: "Pemandangan 1" },
    { src: "https://placehold.co/800x600/ffe5d9/22223b", alt: "Pemandangan 2" },
    { src: "https://placehold.co/1280x800/ffcad4/22223b", alt: "Pemandangan 3" },
    { src: "https://placehold.co/900x600/d8e2dc/22223b", alt: "Pemandangan 1" },
    { src: "https://placehold.co/900x600/d8e2dc/22223b", alt: "Pemandangan 1" },
    { src: "https://placehold.co/1200x900/d8e2dc/22223b", alt: "Pemandangan 1" },
  ],
  layout: "random",
}) }}
