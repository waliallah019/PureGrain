"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, TrendingUp, Award, Globe } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface PageBannerProps {
  title: string
  subtitle?: string
  badge?: string
  gradient?: boolean
  cta?: {
    text: string
    href: string
    variant?: "default" | "outline"
  }
  className?: string
  compact?: boolean
}

const stats = [
  { icon: Globe, label: "40+ Countries", value: "Global Reach" },
  { icon: Award, label: "ISO Certified", value: "Quality Assured" },
  { icon: TrendingUp, label: "500+ Partners", value: "Trusted Worldwide" },
]

export function PageBanner({
  title,
  subtitle,
  badge,
  gradient = true,
  cta,
  className,
  compact = true,
}: PageBannerProps) {
  const [currentStat, setCurrentStat] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  if (compact) {
    return (
      <section
        className={cn(
          "relative overflow-hidden border-b bg-gradient-to-r from-amber-50/50 via-background to-amber-50/50 dark:from-amber-950/10 dark:via-background dark:to-amber-950/10",
          className
        )}
      >
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-[0.02] texture-leather pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Left: Title and Badge */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  {badge && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 px-3 py-1 text-xs flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles className="w-3 h-3" />
                      {badge}
                    </Badge>
                  )}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                    {title.split(" ").map((word, i, arr) => {
                      const isLastWord = i === arr.length - 1
                      const shouldHighlight = arr.length > 3 && (i === arr.length - 2 || i === arr.length - 3)
                      
                      if (shouldHighlight) {
                        return (
                          <span key={i}>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-600">
                              {word}
                            </span>
                            {!isLastWord && " "}
                          </span>
                        )
                      }
                      return <span key={i}>{word}{!isLastWord && " "}</span>
                    })}
                  </h1>
                </div>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-2xl line-clamp-2">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Right: Stats and CTA */}
              <div className="flex items-center gap-4 md:gap-6 shrink-0">
                {/* Rotating Stats */}
                <div className="hidden lg:flex items-center gap-3">
                  {stats.map((stat, index) => {
                    const StatIcon = stat.icon
                    const isActive = index === currentStat
                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 cursor-pointer",
                          isActive
                            ? "bg-amber-100 dark:bg-amber-900/30 shadow-sm scale-105"
                            : "bg-transparent opacity-60 hover:opacity-100"
                        )}
                        onClick={() => setCurrentStat(index)}
                      >
                        <StatIcon className={cn(
                          "w-4 h-4 transition-colors",
                          isActive ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
                        )} />
                        <div className="flex flex-col">
                          <span className={cn(
                            "text-xs font-semibold transition-colors",
                            isActive ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {stat.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{stat.value}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* CTA Button */}
                {cta && (
                  <Button
                    size="sm"
                    variant={cta.variant || "default"}
                    className={cn(
                      "shrink-0 hover:scale-105 transition-all micro-bounce",
                      cta.variant === "outline"
                        ? "border-amber-800 text-amber-800 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-950/20"
                        : "bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-800 shadow-leather"
                    )}
                    asChild
                  >
                    <Link href={cta.href}>
                      {cta.text}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-300/50 to-transparent dark:via-amber-700/30" />
      </section>
    )
  }

  // Fallback to original design if compact=false
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b",
        gradient
          ? "bg-gradient-to-br from-amber-50 via-background to-amber-50/50 dark:from-amber-950/20 dark:via-background dark:to-amber-950/10"
          : "bg-background",
        className
      )}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-200/20 dark:bg-amber-800/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-200/20 dark:bg-amber-800/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="py-12 md:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {badge && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 px-4 py-2 text-sm inline-flex items-center gap-2 animate-fade-in"
              >
                <Sparkles className="w-3 h-3" />
                {badge}
              </Badge>
            )}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight animate-fade-in-delay-1">
              {title.split(" ").map((word, i, arr) => {
                const isLastWord = i === arr.length - 1
                const shouldHighlight = arr.length > 3 && (i === arr.length - 2 || i === arr.length - 3)
                
                if (shouldHighlight) {
                  return (
                    <span key={i}>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-600">
                        {word}
                      </span>
                      {!isLastWord && " "}
                    </span>
                  )
                }
                return <span key={i}>{word}{!isLastWord && " "}</span>
              })}
            </h1>
            {subtitle && (
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-delay-2">
                {subtitle}
              </p>
            )}
            {cta && (
              <div className="pt-4 animate-fade-in-delay-3">
                <Button
                  size="lg"
                  variant={cta.variant || "default"}
                  className={cn(
                    "text-lg px-8 py-6 hover:scale-105 transition-all",
                    cta.variant === "outline"
                      ? "border-amber-800 text-amber-800 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-950/20"
                      : "bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-800"
                  )}
                  asChild
                >
                  <Link href={cta.href}>
                    {cta.text}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
