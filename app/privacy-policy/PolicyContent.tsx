
"use client";
import { useEffect, useRef } from "react";

export default function PolicyContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reveal animation for .reveal elements
    const elements = ref.current?.querySelectorAll(".reveal");
    if (!elements) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [html]);

  return (
    <div ref={ref} className="policyPage__content" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
