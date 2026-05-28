---
comment: false
templateEngine: md, vto
title: "Test untuk masonry"
draft: true
escape: false
---

<div class="masonry-grid delapan">
    {{ for photo of pixelfed.slice(0,8) }}
    <a href="{{ photo.link }}" class="pfed">
      <img src="{{ photo.url }}" alt="{{ photo.title }}" class="fuck" image-size>
    </a>
  {{ /for }}
</div>
