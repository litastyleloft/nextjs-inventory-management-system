"use client";

import { useState } from "react";
import { Package } from "lucide-react";

/**
 * Read-only gallery for view pages: a large image and a row of thumbnails to switch it.
 * The first image (the cover) is shown first. With no images, a placeholder icon.
 */
export default function ImageGallery({ images, alt }: { images: { id: string; url: string }[]; alt: string }) {
  const [current, setCurrent] = useState(0);
  const shown = images[current] ?? images[0];

  return (
    <div className="gallery">
      <div className="gallery-main">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded files served by /api/uploads
          <img src={shown.url} alt={`${alt} (รูปที่ ${current + 1} จาก ${images.length})`} />
        ) : (
          <Package className="gg-icon" aria-label="ยังไม่มีรูปภาพ" />
        )}
      </div>
      {images.length > 1 && (
        <ul className="gallery-thumbs" aria-label="รูปภาพทั้งหมด">
          {images.map((img, i) => (
            <li key={img.id}>
              <button type="button" aria-pressed={i === current} aria-label={`ดูรูปที่ ${i + 1}${i === 0 ? " (ภาพปก)" : ""}`} onClick={() => setCurrent(i)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- uploaded files served by /api/uploads */}
                <img src={img.url} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
