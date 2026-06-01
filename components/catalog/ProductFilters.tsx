// components/catalog/AdvancedProductFilters.tsx
'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Grid, 
  List, 
  SlidersHorizontal,
  Star,
  Package,
  Palette,
  Ruler,
  DollarSign,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterState {
  searchTerm: string;
  productTypes: string[];
  materials: string[];
  priceRange: [number, number];
  availability: string[];
  colors: string[];
  featured: boolean;
  sampleAvailable: boolean;
  sortBy: string;
  dateRange: string;
}

interface AdvancedProductFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalProducts: number;
  filteredProducts: number;
  loading?: boolean;
  className?: string;
}

const PRODUCT_TYPES = [
  { value: 'Wallet', label: 'Wallets', icon: '👛' },
  { value: 'Belt', label: 'Belts', icon: '👜' },
  { value: 'Bag', label: 'Bags', icon: '🎒' },
  { value: 'Jacket', label: 'Jackets', icon: '🧥' },
  { value: 'Footwear', label: 'Footwear', icon: '👞' },
  { value: 'Accessories', label: 'Accessories', icon: '💼' },
];

const MATERIALS = [
  'Genuine Leather',
  'Full-grain Leather',
  'Top-grain Leather',
  'Corrected Leather',
  'Patent Leather',
  'Suede',
  'Nubuck',
  'Exotic Leather',
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First', icon: Calendar },
  { value: 'oldest', label: 'Oldest First', icon: Calendar },
  { value: 'price-low', label: 'Price: Low to High', icon: DollarSign },
  { value: 'price-high', label: 'Price: High to Low', icon: DollarSign },
  { value: 'name-asc', label: 'Name: A to Z', icon: Package },
  { value: 'name-desc', label: 'Name: Z to A', icon: Package },
  { value: 'featured', label: 'Featured First', icon: Star },
];

const AVAILABILITY_OPTIONS = [
  { value: 'In Stock', label: 'In Stock' },
  { value: 'Made to Order', label: 'Made to Order' },
  { value: 'Limited Stock', label: 'Limited Stock' },
];

const COLOR_OPTIONS = [
  { value: 'black', label: 'Black', color: '#000000' },
  { value: 'brown', label: 'Brown', color: '#8B4513' },
  { value: 'tan', label: 'Tan', color: '#D2B48C' },
  { value: 'red', label: 'Red', color: '#DC143C' },
  { value: 'blue', label: 'Blue', color: '#4169E1' },
  { value: 'green', label: 'Green', color: '#228B22' },
  { value: 'white', label: 'White', color: '#FFFFFF' },
  { value: 'gray', label: 'Gray', color: '#808080' },
];

export default function AdvancedProductFilters({
  onFiltersChange,
  viewMode,
  onViewModeChange,
  totalProducts,
  filteredProducts,
  loading = false,
  className = ''
}: AdvancedProductFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    productTypes: [],
    materials: [],
    priceRange: [0, 1000],
    availability: [],
    colors: [],
    featured: false,
    sampleAvailable: false,
    sortBy: 'newest',
    dateRange: 'all',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    onFiltersChange(filters);
    
    // Update active filters for display
    const active = [];
    if (filters.searchTerm) active.push('search');
    if (filters.productTypes.length > 0) active.push('types');
    if (filters.materials.length > 0) active.push('materials');
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) active.push('price');
    if (filters.availability.length > 0) active.push('availability');
    if (filters.colors.length > 0) active.push('colors');
    if (filters.featured) active.push('featured');
    if (filters.sampleAvailable) active.push('sample');
    
    setActiveFilters(active);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).includes(value)
        ? (prev[key] as string[]).filter(item => item !== value)
        : [...(prev[key] as string[]), value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      productTypes: [],
      materials: [],
      priceRange: [0, 1000],
      availability: [],
      colors: [],
      featured: false,
      sampleAvailable: false,
      sortBy: 'newest',
      dateRange: 'all',
    });
  };

  const clearSpecificFilter = (filterType: string) => {
    switch (filterType) {
      case 'search':
        updateFilter('searchTerm', '');
        break;
      case 'types':
        updateFilter('productTypes', []);
        break;
      case 'materials':
        updateFilter('materials', []);
        break;
      case 'price':
        updateFilter('priceRange', [0, 1000]);
        break;
      case 'availability':
        updateFilter('availability', []);
        break;
      case 'colors':
        updateFilter('colors', []);
        break;
      case 'featured':
        updateFilter('featured', false);
        break;
      case 'sample':
        updateFilter('sampleAvailable', false);
        break;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Filter Bar */}
      <div className="bg-card/80 backdrop-blur-sm rounded-lg border border-border p-4 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products, materials, or tags..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Category Filters */}
          <div className="flex flex-wrap gap-2">
            {PRODUCT_TYPES.map(type => (
              <Button
                key={type.value}
                variant={filters.productTypes.includes(type.value) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleArrayFilter('productTypes', type.value)}
                className="text-xs"
              >
                <span className="mr-1">{type.icon}</span>
                {type.label}
              </Button>
            ))}
          </div>

          {/* Sort and View */}
          <div className="flex items-center gap-2">
            <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="w-4 h-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="h-8 w-8 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Advanced
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {loading ? (
              <span>Loading products...</span>
            ) : (
              <span>
                Showing {filteredProducts} of {totalProducts} products
              </span>
            )}
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              <div className="flex gap-1">
                {activeFilters.map(filter => (
                  <Badge
                    key={filter}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => clearSpecificFilter(filter)}
                  >
                    {filter}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-destructive hover:text-destructive"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleContent className="space-y-4">
          <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Price Range */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Price Range
                </Label>
                <div className="space-y-2">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilter('priceRange', value)}
                    min={0}
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${filters.priceRange[0]}</span>
                    <span>${filters.priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Materials
                </Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {MATERIALS.map(material => (
                    <div key={material} className="flex items-center space-x-2">
                      <Checkbox
                        id={material}
                        checked={filters.materials.includes(material)}
                        onCheckedChange={() => toggleArrayFilter('materials', material)}
                      />
                      <Label htmlFor={material} className="text-sm cursor-pointer">
                        {material}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Availability
                </Label>
                <div className="space-y-2">
                  {AVAILABILITY_OPTIONS.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={filters.availability.includes(option.value)}
                        onCheckedChange={() => toggleArrayFilter('availability', option.value)}
                      />
                      <Label htmlFor={option.value} className="text-sm cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Colors
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_OPTIONS.map(color => (
                    <Button
                      key={color.value}
                      variant={filters.colors.includes(color.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleArrayFilter('colors', color.value)}
                      className="h-8 px-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full mr-1 border"
                        style={{ backgroundColor: color.color }}
                      />
                      <span className="text-xs">{color.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Special Filters */}
              <div className="space-y-3">
                <Label>Special Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={filters.featured}
                      onCheckedChange={(checked) => updateFilter('featured', checked)}
                    />
                    <Label htmlFor="featured" className="text-sm cursor-pointer flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Featured Products Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sample"
                      checked={filters.sampleAvailable}
                      onCheckedChange={(checked) => updateFilter('sampleAvailable', checked)}
                    />
                    <Label htmlFor="sample" className="text-sm cursor-pointer">
                      Sample Available
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}