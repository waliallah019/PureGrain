"use client"

import { useState } from "react"
import Image, { type ImageProps } from "next/image"
import { IMAGE_FALLBACK } from "@/lib/cloudinary"

type SafeImageProps = Omit<ImageProps, "src"> & {
  /** Database values can be missing, so an empty src is allowed here. */
  src?: string | null
}

/**
 * next/image for database-driven images: a missing or failed source shows the
 * placeholder rather than a broken-image icon. Failures are still logged so a
 * real configuration problem stays visible during development.
 */
export function SafeImage({ src, onError, ...props }: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showFallback = !src || src === failedSrc

  return (
    <Image
      {...props}
      src={showFallback ? IMAGE_FALLBACK : src}
      onError={(event) => {
        if (src && !showFallback) {
          console.error(`Image failed to load: ${src}`)
          setFailedSrc(src)
        }
        onError?.(event)
      }}
    />
  )
}
