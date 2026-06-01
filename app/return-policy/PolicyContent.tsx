"use client";

import { useEffect, useRef } from "react";

export default function PolicyContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const reveals = root.querySelectorAll<HTMLElement>(".reveal");
    if (!reveals.length) return;

    if (typeof IntersectionObserver === "undefined") {
      reveals.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    reveals.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [html]);

  return (
    <div
      ref={ref}
      className="policyPage"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
