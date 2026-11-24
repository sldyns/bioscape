import React, { useEffect, useRef } from "react";

let observer;
function startLoading(image) {
  image.src = image.dataset.src;
}

export default function CatalogImage({ src, ...props }) {
  const ref = useRef(null);
  useEffect(() => {
    const image = ref.current;
    if (image.getAttribute("src") === src) return;
    if (typeof IntersectionObserver === "undefined") {
      startLoading(image);
      return;
    }
    // Native lazy loading may fetch the entire catalogue several screens ahead.
    // One observer gives the next row a head start and leaves the full-size originals intact.
    observer ??= new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          startLoading(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(image);
    return () => observer.unobserve(image);
  }, [src]);
  return <img ref={ref} data-src={src} alt="" decoding="async" {...props} />;
}
