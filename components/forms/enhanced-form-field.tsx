"use client"

import { ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Info, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface EnhancedFormFieldProps {
  id: string
  label: string
  required?: boolean
  error?: string
  helperText?: string
  tooltip?: string
  icon?: ReactNode
  badge?: string
  badgeVariant?: "default" | "secondary" | "outline" | "destructive"
  className?: string
  children: ReactNode
  stats?: {
    label: string
    value: string | number
  }[]
  showSuccess?: boolean
}

export function EnhancedFormField({
  id,
  label,
  required = false,
  error,
  helperText,
  tooltip,
  icon,
  badge,
  badgeVariant = "secondary",
  className,
  children,
  stats,
  showSuccess = false,
}: EnhancedFormFieldProps) {
  return (
    <div className={cn("space-y-2 form-field-enhanced", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <div className="text-amber-600 dark:text-amber-400">{icon}</div>}
          <Label htmlFor={id} className="text-sm font-semibold text-foreground">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {badge && (
            <Badge variant={badgeVariant} className="text-xs">
              {badge}
            </Badge>
          )}
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {showSuccess && !error && (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        )}
      </div>
      
      <div className="relative">
        {children}
        {error && (
          <div className="flex items-center gap-1 mt-1.5 text-red-500 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
      
      {stats && stats.length > 0 && (
        <div className="flex gap-4 pt-2 border-t border-border/50">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className="text-sm font-semibold text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  showSuccess?: boolean
}

export function EnhancedInput({ error, showSuccess, className, ...props }: EnhancedInputProps) {
  return (
    <Input
      className={cn(
        "transition-premium focus-premium",
        error && "border-red-500 focus:ring-red-500",
        showSuccess && !error && "border-green-500 focus:ring-green-500",
        className
      )}
      {...props}
    />
  )
}

interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  showSuccess?: boolean
}

export function EnhancedTextarea({ error, showSuccess, className, ...props }: EnhancedTextareaProps) {
  return (
    <Textarea
      className={cn(
        "transition-premium focus-premium resize-none",
        error && "border-red-500 focus:ring-red-500",
        showSuccess && !error && "border-green-500 focus:ring-green-500",
        className
      )}
      {...props}
    />
  )
}

interface EnhancedSelectProps {
  value: string
  onValueChange: (value: string) => void
  error?: string
  showSuccess?: boolean
  children: ReactNode
  placeholder?: string
  className?: string
}

export function EnhancedSelect({
  value,
  onValueChange,
  error,
  showSuccess,
  children,
  placeholder,
  className,
}: EnhancedSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          "transition-premium focus-premium",
          error && "border-red-500 focus:ring-red-500",
          showSuccess && !error && "border-green-500 focus:ring-green-500",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  )
}

