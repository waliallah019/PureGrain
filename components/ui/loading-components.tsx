'use client';

import { cn } from '@/lib/utils';
import { Loader2, Package, ShoppingBag, Sparkles } from 'lucide-react';
import React from 'react';

// Enhanced Loading Spinner
export const LoadingSpinner = ({
  size = 'default',
  className = '',
  text = 'Loading...'
}: {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  text?: string;
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size])} />
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
};

// Product Card Skeleton with better animation
export const ProductCardSkeleton = ({
  className = '',
  showButton = true,
  style
}: {
  className?: string;
  showButton?: boolean;
  style?: React.CSSProperties;
}) => (
  <div
    className={cn(
      'bg-card rounded-lg border border-border overflow-hidden shadow-sm',
      'animate-pulse',
      className
    )}
    style={style}
  >
    {/* Image skeleton */}
    <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/60">
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>

    {/* Content skeleton */}
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-8" />
      </div>
      <div className="h-3 bg-muted rounded w-1/2" />
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-5 bg-muted rounded w-16" />
        <div className="h-5 bg-muted rounded w-16" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-5 bg-muted rounded w-20" />
        {showButton && <div className="h-8 bg-muted rounded w-20" />}
      </div>
    </div>
  </div>
);

// Grid skeleton for multiple products
export const ProductGridSkeleton = ({
  count = 8,
  className = ''
}: {
  count?: number;
  className?: string;
}) => (
  <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6', className)}>
    {Array.from({ length: count }).map((_, index) => (
      <ProductCardSkeleton
        key={index}
        className="animate-pulse"
        style={{ animationDelay: `${index * 100}ms` }}
      />
    ))}
  </div>
);

// Enhanced empty state component
export const EmptyState = ({
  icon: Icon = Package,
  title = 'No items found',
  description = 'Try adjusting your search or filter criteria.',
  action,
  className = ''
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('text-center py-16', className)}>
    <div className="relative mb-6">
      <Icon className="w-16 h-16 text-muted-foreground mx-auto" />
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-muted rounded-full animate-pulse" />
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
    {action && <div className="flex justify-center">{action}</div>}
  </div>
);

// Loading overlay for transitions
export const LoadingOverlay = ({
  show = false,
  text = 'Loading...',
  className = ''
}: {
  show?: boolean;
  text?: string;
  className?: string;
}) => {
  if (!show) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
        'flex items-center justify-center',
        'animate-in fade-in duration-200',
        className
      )}
    >
      <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-foreground font-medium">{text}</span>
        </div>
      </div>
    </div>
  );
};

// Shimmer effect for better loading animation
export const ShimmerEffect = ({
  className = '',
  height = 'h-4',
  width = 'w-full'
}: {
  className?: string;
  height?: string;
  width?: string;
}) => (
  <div className={cn('relative overflow-hidden bg-muted rounded', height, width, className)}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
  </div>
);

// Progress indicator for multi-step processes
export const ProgressIndicator = ({
  currentStep = 0,
  totalSteps = 3,
  className = ''
}: {
  currentStep?: number;
  totalSteps?: number;
  className?: string;
}) => (
  <div className={cn('flex items-center gap-2', className)}>
    {Array.from({ length: totalSteps }).map((_, index) => (
      <div key={index} className="flex items-center">
        <div
          className={cn(
            'w-3 h-3 rounded-full transition-all duration-300',
            index <= currentStep ? 'bg-primary' : 'bg-muted'
          )}
        />
        {index < totalSteps - 1 && (
          <div
            className={cn(
              'w-6 h-px mx-1 transition-all duration-300',
              index < currentStep ? 'bg-primary' : 'bg-muted'
            )}
          />
        )}
      </div>
    ))}
  </div>
);

// Floating action button with animation
export const FloatingActionButton = ({
  onClick,
  icon: Icon = Sparkles,
  className = ''
}: {
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'fixed bottom-6 right-6 z-40',
      'w-14 h-14 rounded-full',
      'bg-primary text-primary-foreground',
      'shadow-lg hover:shadow-xl',
      'transition-all duration-300',
      'hover:scale-110 active:scale-95',
      'flex items-center justify-center',
      'animate-in slide-in-from-bottom-4',
      className
    )}
  >
    <Icon className="w-6 h-6" />
  </button>
);

// Category filter skeleton
export const CategoryFilterSkeleton = () => (
  <div className="flex gap-2 overflow-x-auto pb-2">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="h-10 bg-muted rounded-full px-4 flex-shrink-0 animate-pulse"
        style={{
          width: `${60 + Math.random() * 40}px`,
          animationDelay: `${index * 100}ms`
        }}
      />
    ))}
  </div>
);

// Search result skeleton
export const SearchResultSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border animate-pulse"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
        <div className="h-8 bg-muted rounded w-20" />
      </div>
    ))}
  </div>
);
