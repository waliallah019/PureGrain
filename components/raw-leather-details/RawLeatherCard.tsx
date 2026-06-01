"use client";

import React from 'react';
import { IRawLeather } from '@/types/rawLeather';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Eye,
  Palette,
  Ruler,
  PiggyBank,
  Star,
  CheckCircle,
  DollarSign,
  Package,
  ShoppingCart,
  Zap,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface RawLeatherCardProps {
  rawLeather: IRawLeather;
  viewMode?: 'grid' | 'list';
}

export default function RawLeatherCard({ rawLeather, viewMode = 'grid' }: RawLeatherCardProps) {
  const {
    _id,
    name,
    description,
    animal,
    leatherType,
    finish,
    colors,
    pricePerSqFt,
    minOrderQuantity,
    thickness,
    images,
    isFeatured,
    sampleAvailable,
    negotiable,
    createdAt
  } = rawLeather;

  // Grid view (default) - Enhanced
  if (viewMode === 'grid') {
    return (
      <Card className="group overflow-hidden border-0 shadow-leather hover-lift transition-premium h-full flex flex-col bg-gradient-to-br from-background to-muted/30">
        <div className="relative overflow-hidden">
          {/* Image */}
          <div className="aspect-video bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800 relative">
            {images && images.length > 0 ? (
              <img
                src={images[0]}
                alt={name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-16 w-16 text-amber-600/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
            {isFeatured && (
              <Badge className="bg-gradient-to-r from-amber-600 to-amber-700 text-white border-0 shadow-lg">
                <Star className="mr-1 h-3 w-3 fill-white" />
                Featured
              </Badge>
            )}
            {sampleAvailable && (
              <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white border-0 shadow-lg">
                <ShoppingCart className="mr-1 h-3 w-3" />
                Sample
              </Badge>
            )}
            {negotiable && (
              <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 shadow-lg">
                <DollarSign className="mr-1 h-3 w-3" />
                Negotiable
              </Badge>
            )}
          </div>

          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
            <Button
              size="sm"
              className="bg-white text-foreground hover:bg-amber-50 shadow-lg"
              asChild
            >
              <Link href={`/catalog/raw-leather/${_id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Quick View
              </Link>
            </Button>
          </div>
        </div>

        <CardContent className="p-6 flex flex-col flex-1">
          <div className="space-y-4 flex-1">
            {/* Header */}
            <div>
              <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            </div>

            {/* Key Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <PiggyBank className="h-4 w-4 text-amber-600" />
                <span className="text-xs text-muted-foreground">{animal}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Ruler className="h-4 w-4 text-amber-600" />
                <span className="text-xs text-muted-foreground">{thickness || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Palette className="h-4 w-4 text-amber-600" />
                <span className="text-xs text-muted-foreground">
                  {colors?.length || 0} Colors
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <CheckCircle className="h-4 w-4 text-amber-600" />
                <span className="text-xs text-muted-foreground">{finish}</span>
              </div>
            </div>

            {/* MOQ & Pricing */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">MOQ:</span>
                  <span className="text-sm font-semibold text-foreground">
                    {minOrderQuantity || 'N/A'} sq ft
                  </span>
                </div>
                {pricePerSqFt && (
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">From</div>
                    <div className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      ${pricePerSqFt.toFixed(2)}/sq ft
                    </div>
                  </div>
                )}
              </div>
              {leatherType && (
                <div className="flex items-center gap-2 text-xs">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{leatherType}</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            <Button
              variant="outline"
              className="w-full group-hover:bg-amber-50 dark:group-hover:bg-amber-950/20 group-hover:border-amber-300 transition-colors"
              asChild
            >
              <Link href={`/catalog/raw-leather/${_id}`}>
                View Details
                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view - Enhanced
  return (
    <Card className="group overflow-hidden border-0 shadow-leather hover-lift transition-premium">
      <div className="flex gap-6">
        <div className="relative w-48 h-48 flex-shrink-0 overflow-hidden rounded-lg">
          {images && images.length > 0 ? (
            <img
              src={images[0]}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900 dark:to-amber-800">
              <Package className="h-12 w-12 text-amber-600/30" />
            </div>
          )}
          {isFeatured && (
            <Badge className="absolute top-2 left-2 bg-amber-600 text-white">
              <Star className="mr-1 h-3 w-3 fill-white" />
              Featured
            </Badge>
          )}
        </div>

        <CardContent className="p-6 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-1">{name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{animal}</span>
              </div>
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{thickness}</span>
              </div>
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{colors?.length || 0} Colors</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">MOQ: {minOrderQuantity} sq ft</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            {pricePerSqFt && (
              <div>
                <div className="text-xs text-muted-foreground">Starting from</div>
                <div className="text-xl font-bold text-amber-700 dark:text-amber-400">
                  ${pricePerSqFt.toFixed(2)}/sq ft
                </div>
              </div>
            )}
            <Button
              className="bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-800"
              asChild
            >
              <Link href={`/catalog/raw-leather/${_id}`}>
                View Details
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
