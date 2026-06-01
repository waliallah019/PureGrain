// my-leather-platform/app/quote-request/QuoteRequestFormContent.tsx
"use client"; // This component MUST be a client component

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { IProduct } from '@/types/product';
import { IRawLeather } from '@/types/rawLeather';
import {
  countries,
  businessTypes as configBusinessTypes,
} from '@/lib/config/shippingConfig';
import { cn } from '@/lib/utils'; // Import cn for conditional classNames

// Define types and constants for this specific quote form
type QuoteRequestProductCategory = 'raw-leather' | 'finished-products' | 'custom';
const productCategories: QuoteRequestProductCategory[] = ['raw-leather', 'finished-products', 'custom'];
const leatherTypes = ["Cowhide", "Buffalo", "Goat", "Sheep", "Exotic", "Other"];
const finishTypes = ["Aniline", "Semi-Aniline", "Pigmented", "Nubuck", "Suede", "Other"];
const timelines = ['asap', '1-2weeks', '1month', '2-3months', 'flexible', 'custom'];


export function QuoteRequestFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasPrefilled = useRef(false);
  const [customTimelineText, setCustomTimelineText] = useState('');
  const [availableColors, setAvailableColors] = useState<string[]>([]); // New state for available colors
  const [submitPopup, setSubmitPopup] = useState<{
    open: boolean;
    success: boolean;
    title: string;
    message: string;
  }>({
    open: false,
    success: true,
    title: '',
    message: '',
  });


  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    country: '',
    businessType: '' as string,
    productCategory: '' as QuoteRequestProductCategory | '',
    // Leather Hides Specific
    leatherType: '',
    finish: '',
    thickness: '',
    // Finished Product Specific
    materialUsed: '',
    dimensions: '',
    // Common
    color: '', // This will be the selected color
    quantity: 0,
    quantityUnit: '',
    timeline: '',
    specifications: '',
    productId: '',
    productName: '',
    productTypeCategory: '' as 'finished-product' | 'raw-leather' | '',
  });

  // Pre-fill logic based on URL params
  useEffect(() => {
    const itemId = searchParams.get('itemId');
    const itemTypeCategoryFromUrl = searchParams.get('itemTypeCategory');
    const itemName = searchParams.get('itemName');

    const prefillProductCategory: QuoteRequestProductCategory | undefined =
      itemTypeCategoryFromUrl === 'finished-product'
        ? 'finished-products'
        : (itemTypeCategoryFromUrl === 'raw-leather'
            ? 'raw-leather'
            : undefined);

    const prefillProductTypeCategory: 'finished-product' | 'raw-leather' | '' =
        (itemTypeCategoryFromUrl === 'finished-product' || itemTypeCategoryFromUrl === 'raw-leather')
            ? itemTypeCategoryFromUrl
            : '';


    if (itemId && itemName && prefillProductCategory && prefillProductTypeCategory && !hasPrefilled.current) {
      setLoading(true);
      const fetchProductDetails = async () => {
        try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
          let productDetails: IProduct | IRawLeather | null = null;
          let prefilledName = itemName;
          let prefilledLeatherType = '';
          let prefilledFinish = '';
          let prefilledThickness = '';
          let prefilledMaterialUsed = '';
          let prefilledDimensions = '';
          let prefilledQuantity = 0;
          let prefilledQuantityUnit = '';
          let fetchedColors: string[] = []; // Store all fetched colors

          if (prefillProductTypeCategory === 'finished-product') {
            const res = await axios.get(`${apiBaseUrl}/finished-products/${itemId}`);
            productDetails = res.data.data;
            prefilledName = (productDetails as IProduct).name || prefilledName;
            prefilledQuantity = (productDetails as IProduct).moq || 1;
            prefilledQuantityUnit = (productDetails as IProduct).priceUnit || 'units';
            fetchedColors = (productDetails as IProduct).colorVariants || []; // Get all color variants
            prefilledMaterialUsed = (productDetails as IProduct).materialUsed || '';
            prefilledDimensions = (productDetails as IProduct).dimensions || '';

          } else if (prefillProductTypeCategory === 'raw-leather') {
            const res = await axios.get(`${apiBaseUrl}/raw-leather/${itemId}`);
            productDetails = res.data.data;
            prefilledName = (productDetails as IRawLeather).name || prefilledName;
            prefilledLeatherType = (productDetails as IRawLeather).leatherType || '';
            prefilledFinish = (productDetails as IRawLeather).finish || '';
            prefilledThickness = (productDetails as IRawLeather).thickness || '';
            fetchedColors = (productDetails as IRawLeather).colors || []; // Get all colors
            prefilledQuantity = (productDetails as IRawLeather).minOrderQuantity || 1;
            prefilledQuantityUnit = (productDetails as IRawLeather).priceUnit || 'sq ft';
          }

          if (productDetails || prefilledName) {
            setFormData(prev => ({
              ...prev,
              productId: itemId,
              productName: prefilledName,
              productTypeCategory: prefillProductTypeCategory,
              productCategory: prefillProductCategory,
              leatherType: prefilledLeatherType,
              finish: prefilledFinish,
              thickness: prefilledThickness,
              materialUsed: prefilledMaterialUsed,
              dimensions: prefilledDimensions,
              color: fetchedColors.length > 0 ? fetchedColors[0] : '', // Select first color by default
              quantity: prefilledQuantity,
              quantityUnit: prefilledQuantityUnit, // Set prefilled unit
              specifications: `Quote request for: ${prefilledName}`,
            }));
            setAvailableColors(fetchedColors); // Set available colors
            hasPrefilled.current = true;
          } else {
            toast.error('Could not pre-fill product details.');
          }
        } catch (error) {
          console.error("Failed to fetch product for pre-filling:", error);
          toast.error('Failed to pre-fill product details from API.');
        } finally {
          setLoading(false);
        }
      };
      fetchProductDetails();
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.companyName.trim()) newErrors.companyName = 'Company Name is required.';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact Person is required.';
    if (!formData.email.trim()) newErrors.email = 'Email Address is required.';
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = 'Invalid email format.';
    if (!formData.country.trim()) newErrors.country = 'Country is required.';
    if (!formData.productCategory.trim()) newErrors.productCategory = 'Product Category is required.';

    if (formData.productCategory !== 'custom' && !formData.productName.trim()) {
      newErrors.productName = 'Product Name is required if not a custom request.';
    }

    // Required fields based on new requirements
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity required must be at least 1.';
    if (!formData.quantityUnit.trim()) newErrors.quantityUnit = 'Quantity unit is required.';
    // Color is required for pre-filled or specific products (not custom)
    if (isProductCategorySpecific && !formData.color.trim()) {
      newErrors.color = 'Please select a color or specify in details.';
    }
    // Timeline is optional, but custom text is required if 'custom' is selected
    if (formData.timeline === 'custom' && !customTimelineText.trim()) {
      newErrors.timeline = 'Please specify your custom timeline.';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? 0 : Number(value);
    setFormData((prev) => ({ ...prev, quantity: numValue < 0 ? 0 : numValue }));
    setErrors(prev => ({ ...prev, quantity: '' }));
  };

  const handleSelectChange = (name: string) => (value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value as any }));
    setErrors(prev => ({ ...prev, [name]: '' }));

    if (name === 'timeline' && value !== 'custom') {
      setCustomTimelineText('');
    }

    if (name === 'productCategory') {
      // Clear product specific details and available colors when category changes
      setAvailableColors([]); // Clear available colors
      setFormData(prev => ({
        ...prev,
        productId: '',
        productName: '',
        productTypeCategory: '',
        leatherType: '',
        finish: '',
        thickness: '',
        materialUsed: '',
        dimensions: '',
        color: '', // Clear selected color
        quantityUnit: '', // Reset unit for custom or new category
        specifications: '',
      }));
    }
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
    setErrors(prev => ({ ...prev, color: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form.');
      console.log('Validation errors:', errors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      let finalItemTypeCategory = formData.productTypeCategory;
      if (formData.productCategory === 'custom') {
        finalItemTypeCategory = 'finished-product';
      }

      const effectiveTimeline = formData.timeline === 'custom' ? customTimelineText : formData.timeline;

      const payload = {
        itemName: formData.productName || (formData.productCategory === 'custom' ? 'Custom Product Request' : 'Unknown Product'),
        itemId: formData.productId || undefined,
        itemTypeCategory: finalItemTypeCategory || (formData.productCategory === 'raw-leather' ? 'raw-leather' : 'finished-product'),

        customerName: formData.contactPerson,
        customerEmail: formData.email,
        companyName: formData.companyName,
        customerPhone: formData.phone.trim() || undefined,
        destinationCountry: formData.country,

        quantity: formData.quantity,
        quantityUnit: formData.quantityUnit,
        // Combine product specific details and timeline into specifications
        additionalComments: [
          formData.specifications.trim(),
          formData.productName && formData.productCategory === 'custom' ? `Custom Product Name: ${formData.productName}` : '',
          formData.leatherType ? `Leather Type: ${formData.leatherType}` : '',
          formData.finish ? `Finish: ${formData.finish}` : '',
          formData.thickness ? `Thickness: ${formData.thickness}` : '',
          formData.materialUsed ? `Material Used: ${formData.materialUsed}` : '',
          formData.dimensions ? `Dimensions: ${formData.dimensions}` : '',
          formData.color ? `Requested Color: ${formData.color}` : '',
          effectiveTimeline ? `Required Timeline: ${effectiveTimeline}` : '',
        ].filter(Boolean).join('\n').trim() || undefined,
      };

      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/quote-requests`, payload);

      if (response.data.success) {
        // Reset ALL fields
        setFormData({
          companyName: '', contactPerson: '', email: '', phone: '',
          country: '', businessType: '' as string,
          productCategory: '' as QuoteRequestProductCategory | '',
          leatherType: '', finish: '', thickness: '', materialUsed: '', dimensions: '', color: '',
          quantity: 0, quantityUnit: '',
          timeline: '', specifications: '',
          productId: '', productName: '', productTypeCategory: '',
        });
        setCustomTimelineText('');
        setAvailableColors([]); // Reset available colors
        hasPrefilled.current = false;
        setSubmitPopup({
          open: true,
          success: true,
          title: 'Quote Request Submitted',
          message: 'Your quote request has been submitted successfully. Our team will respond within 48 hours.',
        });
      } else {
        setSubmitPopup({
          open: true,
          success: false,
          title: 'Submission Failed',
          message: response.data.message || 'Failed to submit quote request.',
        });
      }
    } catch (error: any) {
      console.error('Quote request submission error:', error.response?.data || error.message);
      const backendErrors = error.response?.data?.errors;
      if (backendErrors && Array.isArray(backendErrors)) {
        const mappedErrors = backendErrors.reduce((acc: any, err: any) => {
            const fieldName = err.path.join('.').replace(/^body\./, '');
            acc[fieldName] = err.message;
            return acc;
        }, {});
        setErrors(mappedErrors);
        setSubmitPopup({
          open: true,
          success: false,
          title: 'Validation Failed',
          message: 'Please check your inputs and try again.',
        });
      } else {
        setSubmitPopup({
          open: true,
          success: false,
          title: 'Submission Failed',
          message: error.response?.data?.message || 'An unexpected error occurred.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const isPrefilled = !!(formData.productId && formData.productName && formData.productTypeCategory);
  const isProductCategorySpecific = formData.productCategory === 'raw-leather' || formData.productCategory === 'finished-products';

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-20">
            <div className="lg:col-span-3">
              <div className="mb-8">
                <p className="text-label text-brass mb-4">Quote Request</p>
                <h2 className="heading-subsection text-foreground mb-4">Request Details</h2>
                <div className="divider-brass mb-6" />
                <p className="text-muted-foreground max-w-2xl">
                  Share your product requirements and we will respond with a detailed quote within 48 hours.
                </p>
              </div>

              {isPrefilled && (
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md text-sm border border-blue-200 dark:border-blue-700 mb-8">
                  <div className="font-medium text-blue-800 dark:text-blue-200 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Pre-filled for: <span className="font-semibold ml-1">{formData.productName || 'N/A'}</span>
                    {formData.productTypeCategory && (
                      <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                        {formData.productTypeCategory === 'finished-product' ? 'Finished Product' : 'Leather Hides'}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">Company Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="companyName" name="companyName" placeholder="Your Company Ltd."
                          value={formData.companyName} onChange={handleChange}
                          required className={errors.companyName ? 'border-red-500' : ''}
                        />
                        {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPerson">Contact Person <span className="text-red-500">*</span></Label>
                        <Input
                          id="contactPerson" name="contactPerson" placeholder="John Doe"
                          value={formData.contactPerson} onChange={handleChange}
                          required className={errors.contactPerson ? 'border-red-500' : ''}
                        />
                        {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                        <Input
                          id="email" name="email" type="email" placeholder="john@company.com"
                          value={formData.email} onChange={handleChange}
                          required className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone" name="phone" type="tel" placeholder="+1 (555) 123-4567"
                          value={formData.phone} onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
                        <Select value={formData.country || undefined} onValueChange={handleSelectChange('country')}>
                          <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select destination country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map(country => (
                              <SelectItem key={country} value={country}>{country}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessType">Business Type</Label>
                        <Select value={formData.businessType || undefined} onValueChange={handleSelectChange('businessType')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                          <SelectContent>
                            {configBusinessTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">Product Requirements</h3>
                    {/* Product Name */}
                    <div className="space-y-2">
                      <Label htmlFor="productName">Product Name {formData.productCategory !== 'custom' && <span className="text-red-500">*</span>}</Label>
                      <Input
                        id="productName" name="productName"
                        placeholder={formData.productCategory === 'custom' ? 'Describe your custom product (optional)' : 'e.g., Leather Jacket, Vegetable Tanned Cowhide'}
                        value={formData.productName}
                        onChange={handleChange}
                        readOnly={isPrefilled && isProductCategorySpecific}
                        disabled={isPrefilled && isProductCategorySpecific}
                        className={isPrefilled && isProductCategorySpecific ? "bg-muted-foreground/10" : (errors.productName ? 'border-red-500' : '')}
                        required={formData.productCategory !== 'custom'}
                      />
                       {errors.productName && <p className="text-red-500 text-xs mt-1">{errors.productName}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="productCategory">Product Category <span className="text-red-500">*</span></Label>
                        <Select
                          value={formData.productCategory || undefined}
                          onValueChange={handleSelectChange('productCategory')}
                          disabled={isPrefilled} // Disable if pre-filled
                        >
                          <SelectTrigger className={cn(errors.productCategory ? 'border-red-500' : '', isPrefilled ? 'bg-muted-foreground/10' : '')}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {productCategories.map(cat => (
                              <SelectItem key={cat} value={cat}>
                                {cat === 'raw-leather' ? 'Leather Hides' : cat === 'finished-products' ? 'Finished Products' : 'Custom Manufacturing'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.productCategory && <p className="text-red-500 text-xs mt-1">{errors.productCategory}</p>}
                      </div>

                    {formData.productCategory === 'raw-leather' && (
                      <>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="leatherType">Leather Type</Label>
                            <Select
                              value={formData.leatherType || undefined}
                              onValueChange={handleSelectChange('leatherType')}
                              disabled={isPrefilled} // Disable if pre-filled
                            >
                              <SelectTrigger className={cn(isPrefilled ? "bg-muted-foreground/10" : '', '')}>
                                <SelectValue placeholder="Select leather type" />
                              </SelectTrigger>
                              <SelectContent>
                                {leatherTypes.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                                {formData.leatherType && !leatherTypes.includes(formData.leatherType) && (
                                  <SelectItem key={formData.leatherType} value={formData.leatherType}>{formData.leatherType}</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="finish">Finish</Label>
                            <Select
                              value={formData.finish || undefined}
                              onValueChange={handleSelectChange('finish')}
                              disabled={isPrefilled} // Disable if pre-filled
                            >
                              <SelectTrigger className={cn(isPrefilled ? "bg-muted-foreground/10" : '', '')}>
                                <SelectValue placeholder="Select finish" />
                              </SelectTrigger>
                              <SelectContent>
                                {finishTypes.map(fin => (
                                  <SelectItem key={fin} value={fin}>{fin}</SelectItem>
                                ))}
                                {formData.finish && !finishTypes.includes(formData.finish) && (
                                  <SelectItem key={formData.finish} value={formData.finish}>{formData.finish}</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="thickness">Thickness (mm)</Label>
                          <Input
                            id="thickness" name="thickness" placeholder="e.g., 1.2-1.4"
                            value={formData.thickness} onChange={handleChange}
                            readOnly={isPrefilled}
                            disabled={isPrefilled}
                            className={isPrefilled ? "bg-muted-foreground/10" : ''}
                          />
                        </div>
                      </>
                    )}

                    {formData.productCategory === 'finished-products' && (
                      <>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="materialUsed">Material Used</Label>
                            <Input
                              id="materialUsed" name="materialUsed" placeholder="e.g., Cowhide, Suede"
                              value={formData.materialUsed} onChange={handleChange}
                              readOnly={isPrefilled}
                              disabled={isPrefilled}
                              className={isPrefilled ? "bg-muted-foreground/10" : ''}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dimensions">Dimensions</Label>
                            <Input
                              id="dimensions" name="dimensions" placeholder="e.g., 20x30cm, 100x120cm"
                              value={formData.dimensions} onChange={handleChange}
                              readOnly={isPrefilled}
                              disabled={isPrefilled}
                              className={isPrefilled ? "bg-muted-foreground/10" : ''}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Color Selection - Buttons for available colors if product-specific, input for custom */}
                    <div className="space-y-2">
                      <Label htmlFor="color">Color {isProductCategorySpecific && <span className="text-red-500">*</span>}</Label>
                      {isProductCategorySpecific && availableColors.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {availableColors.map(colorOption => (
                            <Button
                              key={colorOption}
                              type="button"
                              variant={formData.color === colorOption ? "default" : "outline"}
                              onClick={() => handleColorSelect(colorOption)}
                              className={cn("capitalize")}
                            >
                              {colorOption}
                            </Button>
                          ))}
                        </div>
                      )}
                      {(isProductCategorySpecific && availableColors.length === 0) || formData.productCategory === 'custom' ? (
                        <Input
                          id="color" name="color" placeholder="e.g., Black, Brown, Tan"
                          value={formData.color} onChange={handleChange}
                          className={errors.color ? 'border-red-500' : ''}
                          required={isProductCategorySpecific}
                          readOnly={isPrefilled && isProductCategorySpecific && availableColors.length > 0} // Make editable if custom, or no predefined colors
                          disabled={isPrefilled && isProductCategorySpecific && availableColors.length > 0}
                        />
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                          For mixed colors or colors not listed, please specify details in "Detailed Specifications".
                      </p>
                      {errors.color && <p className="text-red-500 text-xs mt-1">{errors.color}</p>}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity Required <span className="text-red-500">*</span></Label>
                        <Input
                          id="quantity" name="quantity" type="number" min="1"
                          value={formData.quantity === 0 ? '' : formData.quantity}
                          onChange={handleQuantityChange}
                          required className={errors.quantity ? 'border-red-500' : ''}
                        />
                        {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantityUnit">Quantity Unit <span className="text-red-500">*</span></Label>
                        <Select
                          value={formData.quantityUnit || undefined}
                          onValueChange={handleSelectChange('quantityUnit')}
                        >
                          <SelectTrigger className={errors.quantityUnit ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="units">Units</SelectItem>
                            <SelectItem value="sq ft">Sq Ft</SelectItem>
                            <SelectItem value="pieces">Pieces</SelectItem>
                            <SelectItem value="rolls">Rolls</SelectItem>
                            <SelectItem value="yards">Yards</SelectItem>
                            <SelectItem value="meters">Meters</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            {formData.quantityUnit && !['units','sq ft','pieces','rolls','yards','meters','other'].includes(formData.quantityUnit) && (
                              <SelectItem value={formData.quantityUnit}>{formData.quantityUnit}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {errors.quantityUnit && <p className="text-red-500 text-xs mt-1">{errors.quantityUnit}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeline">Required Timeline</Label>
                      <Select value={formData.timeline || undefined} onValueChange={handleSelectChange('timeline')}>
                        <SelectTrigger className={errors.timeline ? 'border-red-500' : ''}>
                          <SelectValue placeholder="When do you need this?" />
                        </SelectTrigger>
                        <SelectContent>
                          {timelines.map(tl => (
                            <SelectItem key={tl} value={tl}>
                              {tl === 'asap' ? 'As soon as possible' :
                               tl === '1-2weeks' ? '1-2 Weeks' :
                               tl === '1month' ? '1 Month' :
                               tl === '2-3months' ? '2-3 Months' :
                               tl === 'flexible' ? 'Flexible' :
                               'Custom Timeline'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.timeline === 'custom' && (
                        <Input
                          id="customTimelineText"
                          name="customTimelineText"
                          placeholder="e.g., By end of October, 2024"
                          value={customTimelineText}
                          onChange={(e) => setCustomTimelineText(e.target.value)}
                          className={`mt-2 ${errors.timeline ? 'border-red-500' : ''}`}
                        />
                      )}
                      {errors.timeline && <p className="text-red-500 text-xs mt-1">{errors.timeline}</p>}
                    </div>
                  </div>

                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">Additional Information</h3>
                    <div className="space-y-2">
                      <Label htmlFor="specifications">Detailed Specifications</Label>
                      <Textarea
                        id="specifications" name="specifications"
                        placeholder="Please provide any additional specifications, quality requirements, or special requests..."
                        className="min-h-[100px]"
                        value={formData.specifications} onChange={handleChange}
                      />
                    </div>
                  </div>

                <div className="space-y-4">
                  <Button
                    type="submit"
                    className="btn-primary w-full md:w-auto"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-5 w-5 text-white mr-2" />
                    ) : (
                      <Send className="w-5 h-5 mr-2" />
                    )}
                    Submit Quote Request
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    By submitting this form, you agree to our terms of service and privacy policy. We will respond within
                    48 hours with a detailed quote.
                  </p>
                </div>
              </form>
            </div>

            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className="heading-subsection text-foreground mb-4">What Happens Next</h2>
                <div className="divider-brass mb-6" />
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-300">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Review & Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Our team reviews your requirements and analyzes the best options for your needs.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-300">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Detailed Quote</h4>
                    <p className="text-sm text-muted-foreground">
                      We prepare a comprehensive quote including pricing, specifications, and delivery terms.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-300">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Follow-up Call</h4>
                    <p className="text-sm text-muted-foreground">
                      Our sales team contacts you to discuss the quote and answer any questions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-bone border border-border dark:bg-muted/30">
                <h4 className="font-serif text-lg font-medium text-foreground mb-2">Response Time</h4>
                <p className="text-sm text-muted-foreground">
                  We typically respond to quote requests within 24 to 48 business hours. For urgent requirements, please call our sales team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Dialog
        open={submitPopup.open}
        onOpenChange={(open) => setSubmitPopup((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={submitPopup.success ? 'text-green-700' : 'text-red-700'}>
              {submitPopup.title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {submitPopup.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            {submitPopup.success ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setSubmitPopup((prev) => ({ ...prev, open: false }))}
                >
                  Stay Here
                </Button>
                <Button
                  onClick={() => {
                    setSubmitPopup((prev) => ({ ...prev, open: false }));
                    router.push('/catalog');
                  }}
                >
                  Go to Catalog
                </Button>
              </>
            ) : (
              <Button onClick={() => setSubmitPopup((prev) => ({ ...prev, open: false }))}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom CSS for hiding dropdown arrow (only hide icon, do not disable the button) */}
      <style jsx global>{`
        .no-dropdown-arrow svg {
          display: none; /* Hide the icon only */
        }
      `}</style>
    </>
  );
}