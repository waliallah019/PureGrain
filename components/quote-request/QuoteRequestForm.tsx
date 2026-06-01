// my-leather-platform/components/quote-request/QuoteRequestForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';
import { countries } from '@/lib/config/shippingConfig'; // Import countries list
import { IProduct } from '@/types/product'; // For pre-filling
import { IRawLeather } from '@/types/rawLeather'; // For pre-filling
import { QuoteRequestItemType } from '@/types/quote'; // Import QuoteRequestItemType

interface QuoteRequestFormProps {
  initialItemId?: string;
  initialItemName?: string;
  initialItemTypeCategory?: QuoteRequestItemType;
  onSuccess?: () => void; // Optional callback for parent component
}

export default function QuoteRequestForm({
  initialItemId,
  initialItemName,
  initialItemTypeCategory,
  onSuccess,
}: QuoteRequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    itemName: initialItemName || '',
    itemId: initialItemId || '',
    itemTypeCategory: initialItemTypeCategory || ('finished-product' as QuoteRequestItemType), // Default if not pre-filled

    customerName: '',
    customerEmail: '',
    companyName: '',
    customerPhone: '',
    destinationCountry: countries[0], // Default to first country in list

    quantity: 1,
    quantityUnit: 'units', // Default unit, adjust based on item type if needed
    additionalComments: '',
  });

  // Pre-fill item details if provided
  useEffect(() => {
    if (initialItemId && initialItemName && initialItemTypeCategory) {
      setFormData(prev => ({
        ...prev,
        itemName: initialItemName,
        itemId: initialItemId,
        itemTypeCategory: initialItemTypeCategory,
      }));
    }
  }, [initialItemId, initialItemName, initialItemTypeCategory]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerName.trim()) newErrors.customerName = 'Your Name is required.';
    if (!formData.customerEmail.trim()) newErrors.customerEmail = 'Email is required.';
    if (formData.customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail.trim())) newErrors.customerEmail = 'Invalid email format.';
    if (!formData.companyName.trim()) newErrors.companyName = 'Company Name is required.';
    if (!formData.destinationCountry.trim() || formData.destinationCountry === countries[0]) newErrors.destinationCountry = 'Destination Country is required.';
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be at least 1.';
    if (!formData.quantityUnit.trim()) newErrors.quantityUnit = 'Quantity unit is required.';
    if (!formData.itemName.trim()) newErrors.itemName = 'Item Name is required (pre-filled).';
    if (!formData.itemTypeCategory.trim()) newErrors.itemTypeCategory = 'Item Type is required (pre-filled).';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name: string) => (value: string | number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        customerPhone: formData.customerPhone.trim() || undefined, // Send as undefined if empty
        additionalComments: formData.additionalComments.trim() || undefined,
        // Ensure quantity is number
        quantity: Number(formData.quantity),
      };

      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/quote-requests`, payload);

      if (response.data.success) {
        toast.success('Quote request submitted successfully! We will contact you soon.');
        setFormData({ // Reset form
          itemName: initialItemName || '', itemId: initialItemId || '', itemTypeCategory: initialItemTypeCategory || 'finished-product',
          customerName: '', customerEmail: '', companyName: '', customerPhone: '', destinationCountry: countries[0],
          quantity: 1, quantityUnit: 'units', additionalComments: '',
        });
        onSuccess?.(); // Call parent success callback
      } else {
        toast.error(response.data.message || 'Failed to submit quote request.');
      }
    } catch (error: any) {
      console.error('Quote request submission error:', error.response?.data || error.message);
      const backendErrors = error.response?.data?.errors;
      if (backendErrors && Array.isArray(backendErrors)) {
        const mappedErrors = backendErrors.reduce((acc: any, err: any) => {
            const fieldName = err.path.join('.');
            acc[fieldName.startsWith('body.') ? fieldName.substring(5) : fieldName] = err.message;
            return acc;
        }, {});
        setErrors(mappedErrors);
        toast.error('Validation failed. Please check your inputs.');
      } else {
        toast.error(error.response?.data?.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b pb-2">Item Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name</Label>
            <Input id="itemName" name="itemName" value={formData.itemName} readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemTypeCategory">Item Type</Label>
            <Input id="itemTypeCategory" name="itemTypeCategory" value={formData.itemTypeCategory} readOnly disabled />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity <span className="text-red-500">*</span></Label>
            <Input
              id="quantity" name="quantity" type="number" min="1"
              value={formData.quantity} onChange={handleChange}
              required className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantityUnit">Quantity Unit <span className="text-red-500">*</span></Label>
            <Select value={formData.quantityUnit} onValueChange={handleSelectChange('quantityUnit')}>
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
              </SelectContent>
            </Select>
            {errors.quantityUnit && <p className="text-red-500 text-xs mt-1">{errors.quantityUnit}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="additionalComments">Additional Comments</Label>
          <Textarea
            id="additionalComments" name="additionalComments"
            placeholder="Any specific requirements, color preferences, or details..."
            className="min-h-[80px]"
            value={formData.additionalComments} onChange={handleChange}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b pb-2">Your Contact Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Your Name <span className="text-red-500">*</span></Label>
            <Input
              id="customerName" name="customerName" placeholder="John Doe"
              value={formData.customerName} onChange={handleChange}
              required className={errors.customerName ? 'border-red-500' : ''}
            />
            {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerEmail">Your Email <span className="text-red-500">*</span></Label>
            <Input
              id="customerEmail" name="customerEmail" type="email" placeholder="john@example.com"
              value={formData.customerEmail} onChange={handleChange}
              required className={errors.customerEmail ? 'border-red-500' : ''}
            />
            {errors.customerEmail && <p className="text-red-500 text-xs mt-1">{errors.customerEmail}</p>}
          </div>
        </div>
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
            <Label htmlFor="customerPhone">Phone Number</Label>
            <Input
              id="customerPhone" name="customerPhone" type="tel" placeholder="+1 (555) 123-4567"
              value={formData.customerPhone} onChange={handleChange}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="destinationCountry">Destination Country <span className="text-red-500">*</span></Label>
          <Select value={formData.destinationCountry} onValueChange={handleSelectChange('destinationCountry')}>
            <SelectTrigger className={errors.destinationCountry ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map(country => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.destinationCountry && <p className="text-red-500 text-xs mt-1">{errors.destinationCountry}</p>}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-800 text-lg py-6"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="animate-spin h-5 w-5 text-white mr-2" />
        ) : (
          <Send className="w-5 h-5 mr-2" />
        )}
        Submit Quote Request
      </Button>
    </form>
  );
}