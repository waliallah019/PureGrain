"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./WhatsAppButton.module.css";

interface WhatsAppButtonProps {
  /** Phone number in international format with no "+" or spaces, e.g. "923001234567" */
  phoneNumber: string;
  /** Optional pre-filled message that auto-populates in the WhatsApp chat */
  prefillMessage?: string;
  /** Toggle the subtle pulsing ring animation */
  showPulse?: boolean;
  /**
   * Distance from the bottom of the viewport in pixels.
   * Set this so the button clears the Free Samples sticker:
   *   bottomOffset = stickerBottom + stickerHeight + 16px gap
   * The Free Samples sticker is currently:
   *   - mobile: bottom 16px, height 84px  -> 16 + 84 + 16 = 116
   *   - desktop: bottom 24px, height 112px -> 24 + 112 + 16 = 152
   * The default below uses the desktop value; mobile is overridden via a media style below.
   */
  bottomOffset?: number;
}

export default function WhatsAppButton({
  phoneNumber,
  prefillMessage = "",
  showPulse = true,
  bottomOffset = 152,
}: WhatsAppButtonProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  // On the home page, hide until the user scrolls past the hero banner.
  // On every other page, show immediately.
  const [isVisible, setIsVisible] = useState(!isHomePage);

  useEffect(() => {
    if (!isHomePage) {
      setIsVisible(true);
      return;
    }

    setIsVisible(false);

    const onScroll = () => {
      const heroSection = document.getElementById("home-hero");
      const triggerY = heroSection
        ? heroSection.offsetTop + heroSection.offsetHeight - 120
        : window.innerHeight * 0.9;

      setIsVisible(window.scrollY > triggerY);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHomePage, pathname]);

  if (!phoneNumber) return null;

  const sanitizedNumber = phoneNumber.replace(/[^0-9]/g, "");
  const href = `https://wa.me/${sanitizedNumber}${
    prefillMessage ? `?text=${encodeURIComponent(prefillMessage)}` : ""
  }`;

  // Mobile gets a smaller offset because the sticker is shorter on mobile.
  // 116px clears: bottom 16 + sticker height 84 + 16 gap.
  const mobileOffset = Math.min(bottomOffset, 116);

  return (
    <div
      className={`${styles.wrapper} ${isVisible ? styles.visible : styles.hidden}`}
      style={{ bottom: `${bottomOffset}px` }}
      aria-hidden={!isVisible}
    >
      <style>{`
        @media (max-width: 767px) {
          .${styles.wrapper} { bottom: ${mobileOffset}px !important; }
        }
      `}</style>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className={styles.button}
      >
        {showPulse && <span className={styles.pulse} aria-hidden="true" />}

        <svg
          className={styles.icon}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.823 3.41 4.823 4.382.515.257 2.346 1.005 2.89 1.005.546 0 1.964-.732 2.21-1.226.13-.302.187-.66.187-1.005 0-.5-1.83-1.62-1.83-1.94zM16.092 27.4a11.05 11.05 0 0 1-5.738-1.61l-4.117 1.318 1.347-4.043a11.166 11.166 0 1 1 8.508 4.336zM16.092 2.998C8.847 2.998 2.99 8.866 2.99 16.114a13.07 13.07 0 0 0 1.91 6.83L2.99 30l7.183-1.91a13.07 13.07 0 0 0 5.92 1.426c7.244 0 13.103-5.866 13.103-13.114 0-7.247-5.86-13.115-13.103-13.115z" />
        </svg>

        <span className={styles.tooltip} role="tooltip">
          Chat with us on WhatsApp
        </span>
      </a>
    </div>
  );
}
