"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  title: string
  icon?: LucideIcon
  description?: string
  badge?: string
  badgeVariant?: "default" | "secondary" | "outline" | "destructive"
  children: ReactNode
  className?: string
  stats?: {
    label: string
    value: string | number
    icon?: LucideIcon
  }[]
  highlight?: boolean
}

export function FormSection({
  title,
  icon: Icon,
  description,
  badge,
  badgeVariant = "secondary",
  children,
  className,
  stats,
  highlight = false,
}: FormSectionProps) {
  return (
    <Card
      className={cn(
        "border-0 shadow-leather transition-premium hover-lift",
        highlight && "ring-2 ring-amber-500/20 bg-amber-50/30 dark:bg-amber-950/10",
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <Icon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                {title}
                {badge && (
                  <Badge variant={badgeVariant} className="text-xs">
                    {badge}
                  </Badge>
                )}
              </CardTitle>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
        </div>
        {stats && stats.length > 0 && (
          <div className="flex gap-6 mt-4 pt-4 border-t border-border/50">
            {stats.map((stat, index) => {
              const StatIcon = stat.icon
              return (
                <div key={index} className="flex items-center gap-2">
                  {StatIcon && (
                    <StatIcon className="w-4 h-4 text-muted-foreground" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                    <span className="text-sm font-semibold text-foreground">{stat.value}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

