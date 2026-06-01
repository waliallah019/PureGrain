"use client";

import { useState, useEffect, useRef, Suspense, memo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Package, CheckCircle, CreditCard } from "lucide-react";

// Payment instructions component
import PaymentInstructions from '@/components/sample-request/PaymentInstructions';

import { IProduct } from '@/types/product';
import { IRawLeather } from '@/types/rawLeather';
// Import types if they are still needed here and not solely in shippingConfig
import {
  SampleRequestItemType
} from '@/types/request';

// --- IMPORTANT CHANGES HERE ---
// Import getShippingFeeInCents, getShippingFeeInDollars, and the new 'countries' array
// Also import the form options directly from shippingConfig.ts
import {
  getShippingFeeInDollars,
  countries, // Sorted list of countries
  sampleTypes, // Centralized form options
  quantities,
  materialPreferences,
  finishTypes,
  urgencies,
  businessTypes,
  intendedUses,
  futureVolumes
} from '@/lib/config/shippingConfig'; // Ensure this path is correct

// Bank transfer details exposed for client-side instructions UI
const BANK_PAYMENT_DETAILS = {
  bankName: process.env.NEXT_PUBLIC_BANK_NAME || 'Bank Alfalah',
  accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'PUREGRAIN EXPORTS (SMC-PRIVATE) LIMITED',
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || '5573-5002834840',
  iban: process.env.NEXT_PUBLIC_BANK_IBAN || '',
  swiftCode: process.env.NEXT_PUBLIC_BANK_SWIFT || '',
  routingNumber: process.env.NEXT_PUBLIC_BANK_ROUTING_NUMBER || '',
  beneficiaryAddress: process.env.NEXT_PUBLIC_BANK_BENEFICIARY_ADDRESS || '',
};

const CompanySection = memo(function CompanySection({
  companyName,
  contactPerson,
  email,
  phone,
  errors,
  onFieldBlur,
  companyNameRef,
  contactPersonRef,
  emailRef,
  phoneRef,
}: {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  errors: Record<string, string>;
  onFieldBlur: (name: string, value: string) => void;
  companyNameRef: React.MutableRefObject<HTMLInputElement | null>;
  contactPersonRef: React.MutableRefObject<HTMLInputElement | null>;
  emailRef: React.MutableRefObject<HTMLInputElement | null>;
  phoneRef: React.MutableRefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">Company Information</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name <span className="text-red-500">*</span></Label>
          <Input
            id="companyName" name="companyName" placeholder="Your Company Ltd."
            defaultValue={companyName}
            ref={companyNameRef}
            onBlur={(e) => onFieldBlur('companyName', e.target.value)}
            required className={errors.companyName ? 'border-red-500' : ''}
          />
          {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPerson">Contact Person <span className="text-red-500">*</span></Label>
          <Input
            id="contactPerson" name="contactPerson" placeholder="John Doe"
            defaultValue={contactPerson}
            ref={contactPersonRef}
            onBlur={(e) => onFieldBlur('contactPerson', e.target.value)}
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
            defaultValue={email}
            ref={emailRef}
            onBlur={(e) => onFieldBlur('email', e.target.value)}
            required className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone" name="phone" type="tel" placeholder="+1 (555) 123-4567"
            defaultValue={phone}
            ref={phoneRef}
            onBlur={(e) => onFieldBlur('phone', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
});

const ShippingSection = memo(function ShippingSection({
  country,
  urgency,
  address,
  errors,
  countriesOptions,
  urgencyOptions,
  onSelectChange,
  onFieldBlur,
  addressRef,
}: {
  country: string;
  urgency: string;
  address: string;
  errors: Record<string, string>;
  countriesOptions: string[];
  urgencyOptions: string[];
  onSelectChange: (name: string, value: string) => void;
  onFieldBlur: (name: string, value: string) => void;
  addressRef: React.MutableRefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">Shipping Information</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
          <Select defaultValue={country} onValueChange={(value) => onSelectChange('country', value)}>
            <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select destination country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Select a Country">Select a Country</SelectItem>
              {countriesOptions.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="urgency">Urgency</Label>
          <Select defaultValue={urgency} onValueChange={(value) => onSelectChange('urgency', value)}>
            <SelectTrigger>
              <SelectValue placeholder="How urgent?" />
            </SelectTrigger>
            <SelectContent>
              {urgencyOptions.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Shipping Address <span className="text-red-500">*</span></Label>
        <Textarea
          id="address" name="address"
          placeholder="Please provide complete shipping address including postal code"
          className={errors.address ? 'border-red-500' : ''}
          defaultValue={address}
          ref={addressRef}
          onBlur={(e) => onFieldBlur('address', e.target.value)}
          required
        />
        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
      </div>
    </div>
  );
});

const SampleRequirementsSection = memo(function SampleRequirementsSection({
  sampleType,
  quantitySamples,
  materialPreference,
  finishType,
  colorPreferences,
  specificRequests,
  errors,
  options,
  lockProductDerivedFields,
  onSelectChange,
  onFieldBlur,
  specificRequestsRef,
}: {
  sampleType: string;
  quantitySamples: string;
  materialPreference: string;
  finishType: string;
  colorPreferences: string;
  specificRequests: string;
  errors: Record<string, string>;
  options: {
    sampleTypes: string[];
    quantities: string[];
    materialPreferences: string[];
    finishTypes: string[];
    colorOptions: string[];
  };
  lockProductDerivedFields: boolean;
  onSelectChange: (name: string, value: string) => void;
  onFieldBlur: (name: string, value: string) => void;
  specificRequestsRef: React.MutableRefObject<HTMLTextAreaElement | null>;
}) {
  const sampleTypeLabel =
    sampleType === 'raw-leather'
      ? 'Leather Hides'
      : sampleType === 'finished-products'
        ? 'Finished Products'
        : sampleType === 'both'
          ? 'Both Raw & Finished'
          : sampleType;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">Sample Requirements</h3>
      {lockProductDerivedFields && (
        <p className="text-xs text-muted-foreground">
          Sample Type, Material Preference, and Finish Type are auto-filled from the selected catalog product.
        </p>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sampleType">Sample Type <span className="text-red-500">*</span></Label>
          {lockProductDerivedFields ? (
            <Input value={sampleTypeLabel || 'N/A'} readOnly className="bg-muted/40" />
          ) : (
            <Select
              defaultValue={sampleType}
              onValueChange={(value) => onSelectChange('sampleType', value)}
            >
              <SelectTrigger className={errors.sampleType ? 'border-red-500' : ''}>
                <SelectValue placeholder="What type of samples?" />
              </SelectTrigger>
              <SelectContent>
                {options.sampleTypes.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item === 'raw-leather' ? 'Leather Hides' : item === 'finished-products' ? 'Finished Products' : 'Both Raw & Finished'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.sampleType && <p className="text-red-500 text-xs mt-1">{errors.sampleType}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantitySamples">Number of Samples</Label>
          <Select defaultValue={quantitySamples} onValueChange={(value) => onSelectChange('quantitySamples', value)}>
            <SelectTrigger>
              <SelectValue placeholder="How many samples?" />
            </SelectTrigger>
            <SelectContent>
              {options.quantities.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="materialPreference">Material Preference</Label>
          {lockProductDerivedFields ? (
            <Input value={materialPreference || 'N/A'} readOnly className="bg-muted/40" />
          ) : (
            <Select
              defaultValue={materialPreference}
              onValueChange={(value) => onSelectChange('materialPreference', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Material type" />
              </SelectTrigger>
              <SelectContent>
                {options.materialPreferences.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="finishType">Finish Type</Label>
          {lockProductDerivedFields ? (
            <Input value={finishType || 'N/A'} readOnly className="bg-muted/40" />
          ) : (
            <Select
              defaultValue={finishType}
              onValueChange={(value) => onSelectChange('finishType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Finish preference" />
              </SelectTrigger>
              <SelectContent>
                {options.finishTypes.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="colorPreferences">Color Preferences</Label>
          <Select defaultValue={colorPreferences} onValueChange={(value) => onSelectChange('colorPreferences', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select preferred color" />
            </SelectTrigger>
            <SelectContent>
              {options.colorOptions.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="specificRequests">Additional Information</Label>
        <Textarea
          id="specificRequests" name="specificRequests"
          placeholder="Please specify exact products, colors, thicknesses, or any special requirements for your samples..."
          className="min-h-[100px]"
          defaultValue={specificRequests}
          ref={specificRequestsRef}
          onBlur={(e) => onFieldBlur('specificRequests', e.target.value)}
        />
      </div>
    </div>
  );
});

const BusinessSection = memo(function BusinessSection({
  businessType,
  intendedUse,
  futureVolume,
  options,
  onSelectChange,
}: {
  businessType: string;
  intendedUse: string;
  futureVolume: string;
  options: {
    businessTypes: string[];
    intendedUses: string[];
    futureVolumes: string[];
  };
  onSelectChange: (name: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground border-b border-border pb-2">Business Information</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessType">Business Type</Label>
          <Select defaultValue={businessType} onValueChange={(value) => onSelectChange('businessType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              {options.businessTypes.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="intendedUse">Intended Use</Label>
          <Select defaultValue={intendedUse} onValueChange={(value) => onSelectChange('intendedUse', value)}>
            <SelectTrigger>
              <SelectValue placeholder="How will you use these?" />
            </SelectTrigger>
            <SelectContent>
              {options.intendedUses.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="futureVolume">Expected Future Order Volume</Label>
        <Select defaultValue={futureVolume} onValueChange={(value) => onSelectChange('futureVolume', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Estimated order size if samples approved" />
          </SelectTrigger>
          <SelectContent>
            {options.futureVolumes.map((item) => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
});

const SubmitSection = memo(function SubmitSection({
  loading,
  currentShippingFee,
}: {
  loading: boolean;
  currentShippingFee: number;
}) {
  return (
    <div className="space-y-4">
      <Button
        type="submit"
        className="btn-primary w-full md:w-auto"
        disabled={loading}
      >
        {loading ? (
          <svg
            className="animate-spin h-5 w-5 text-white mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <CreditCard className="w-5 h-5 mr-2" />
        )}
        Proceed to Payment (${currentShippingFee.toFixed(2)} Shipping)
      </Button>
      <p className="text-sm text-muted-foreground">
        We'll prepare your samples and ship them within 72 hours. Tracking details will be emailed to you.
      </p>
    </div>
  );
});

// Create a separate component for the form content that uses useSearchParams
function SampleRequestForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [currentShippingFee, setCurrentShippingFee] = useState(0);
  const [formVersion, setFormVersion] = useState(0);
  const [swapMinHeight, setSwapMinHeight] = useState<number | null>(null);

  const companyNameRef = useRef<HTMLInputElement>(null);
  const contactPersonRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const specificRequestsRef = useRef<HTMLTextAreaElement>(null);
  const swapContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    // --- Initialize with placeholder so users must choose ---
    country: 'Select a Country',
    urgency: urgencies[0],
    address: '',
    sampleType: sampleTypes[0],
    quantitySamples: quantities[0],
    materialPreference: materialPreferences[0],
    finishType: finishTypes[0],
    colorPreferences: '',
    specificRequests: '',
    businessType: businessTypes[0],
    intendedUse: intendedUses[0],
    futureVolume: futureVolumes[0],
    productId: '',
    productName: '',
    productTypeCategory: '' as 'finished-product' | 'raw-leather' | '',
  });

  const selectValuesRef = useRef({
    country: 'Select a Country',
    urgency: urgencies[0],
    sampleType: sampleTypes[0],
    quantitySamples: quantities[0],
    materialPreference: materialPreferences[0],
    finishType: finishTypes[0],
    colorPreferences: '',
    businessType: businessTypes[0],
    intendedUse: intendedUses[0],
    futureVolume: futureVolumes[0],
  });

  // Default color options used when a product doesn't provide variants
  const defaultColorOptions = [
    'Black',
    'Brown',
    'Natural',
    'Tan',
    'Dark Brown',
    'White',
    'Gray',
    'Red',
    'Blue',
    'Green'
  ];

  const [colorOptions, setColorOptions] = useState<string[]>(defaultColorOptions);

  const hasPrefilled = useRef(false);

  // Calculate shipping fee whenever country changes in select ref
  useEffect(() => {
    setCurrentShippingFee(getShippingFeeInDollars(selectValuesRef.current.country));
  }, [formVersion]);

  useEffect(() => {
    const productId = searchParams.get('productId');
    const productTypeCategory = searchParams.get('productTypeCategory') as 'finished-product' | 'raw-leather';

    if (productId && productTypeCategory && !hasPrefilled.current) {
      setLoading(true);
      const fetchProduct = async () => {
        try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
          let productData: IProduct | IRawLeather | null = null;
          let name: string = '';
          let material: string = '';
          let finish: string = '';
          let colors: string = '';

          if (productTypeCategory === 'finished-product') {
            const res = await axios.get(`${apiBaseUrl}/finished-products/${productId}`);
            productData = res.data.data;
            name = (productData as IProduct).name;
            material = (productData as IProduct).materialUsed;
            finish = ''; // Finished products might not have a distinct 'finish' field, adjust as needed
            colors = (productData as IProduct).colorVariants?.join(', ') || '';
          } else if (productTypeCategory === 'raw-leather') {
            const res = await axios.get(`${apiBaseUrl}/raw-leather/${productId}`);
            productData = res.data.data;
            name = (productData as IRawLeather).name;
            material = (productData as IRawLeather).leatherType;
            finish = (productData as IRawLeather).finish;
            colors = (productData as IRawLeather).colors?.join(', ') || '';
          }

          if (productData) {
            // parse individual colors from the API returned comma-separated string
            const parsedColors = colors ? colors.split(',').map((c: string) => c.trim()).filter(Boolean) : [];
            if (parsedColors.length) setColorOptions(parsedColors);

            const nextSampleType = (productTypeCategory === 'finished-product' ? 'finished-products' : 'raw-leather') as SampleRequestItemType;
            const nextColor = parsedColors.length ? parsedColors[0] : (colors || '');

            setFormData(prev => {
              const updatedFormData = {
                ...prev,
                productId: productId,
                productName: name,
                productTypeCategory: productTypeCategory,
                sampleType: nextSampleType,
                materialPreference: material,
                finishType: finish,
                colorPreferences: nextColor,
                specificRequests: `Sample request for: ${name} (${productTypeCategory === 'finished-product' ? 'Finished Product' : 'Leather Hides'})`,
              };

              return updatedFormData;
            });

            selectValuesRef.current = {
              ...selectValuesRef.current,
              sampleType: nextSampleType,
              materialPreference: material,
              finishType: finish,
              colorPreferences: nextColor,
            };

            setFormVersion((prev) => prev + 1);
          } else {
            toast.error('Could not pre-fill product details.');
          }
        } catch (error) {
          console.error("Failed to fetch product for pre-filling:", error);
          toast.error('Failed to pre-fill product details. Product not found or API error.');
        } finally {
          setLoading(false);
          hasPrefilled.current = true;
        }
      };
      fetchProduct();
    }
  }, [searchParams]);

  const getFormValues = useCallback(() => {
    return {
      ...formData,
      companyName: companyNameRef.current?.value ?? formData.companyName,
      contactPerson: contactPersonRef.current?.value ?? formData.contactPerson,
      email: emailRef.current?.value ?? formData.email,
      phone: phoneRef.current?.value ?? formData.phone,
      address: addressRef.current?.value ?? formData.address,
      specificRequests: specificRequestsRef.current?.value ?? formData.specificRequests,
      country: selectValuesRef.current.country ?? formData.country,
      urgency: selectValuesRef.current.urgency ?? formData.urgency,
      sampleType: selectValuesRef.current.sampleType ?? formData.sampleType,
      quantitySamples: selectValuesRef.current.quantitySamples ?? formData.quantitySamples,
      materialPreference: selectValuesRef.current.materialPreference ?? formData.materialPreference,
      finishType: selectValuesRef.current.finishType ?? formData.finishType,
      colorPreferences: selectValuesRef.current.colorPreferences ?? formData.colorPreferences,
      businessType: selectValuesRef.current.businessType ?? formData.businessType,
      intendedUse: selectValuesRef.current.intendedUse ?? formData.intendedUse,
      futureVolume: selectValuesRef.current.futureVolume ?? formData.futureVolume,
    };
  }, [formData]);

  const validateForm = () => {
    const values = getFormValues();
    const newErrors: Record<string, string> = {};
    if (!values.companyName.trim()) newErrors.companyName = 'Company Name is required.';
    if (!values.contactPerson.trim()) newErrors.contactPerson = 'Contact Person is required.';
    if (!values.email.trim()) newErrors.email = 'Email Address is required.';
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) newErrors.email = 'Invalid email format.';

    // --- Country Validation ---
    // If you add a "Select a Country" placeholder:
    if (!values.country.trim() || values.country === "Select a Country") {
      newErrors.country = 'Please select a country.';
    }
    // If you don't use a placeholder and countries[0] is a valid default:
    // if (!formData.country.trim()) newErrors.country = 'Country is required.';

    if (!values.address.trim()) newErrors.address = 'Shipping Address is required.';
    if (!values.sampleType.trim()) newErrors.sampleType = 'Sample Type is required.';


    setErrors(newErrors);
    setFormData(prev => ({ ...prev, ...values }));

    const errorKeys = Object.keys(newErrors);
    return {
      isValid: errorKeys.length === 0,
      firstError: errorKeys.length ? newErrors[errorKeys[0]] : '',
      errorList: errorKeys.map((key) => newErrors[key]),
    };
  };

  const handleSelectValueChange = useCallback((name: string, value: string) => {
    selectValuesRef.current = { ...selectValuesRef.current, [name]: value } as typeof selectValuesRef.current;
    if (name === 'country') {
      setCurrentShippingFee(getShippingFeeInDollars(value));
    }
    setErrors(prev => ({ ...prev, [name]: '' }));
  }, []);

  const handleFieldBlur = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  }, []);

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm();
    if (!validation.isValid) {
      const message = validation.errorList.length
        ? validation.errorList.join('\n')
        : (validation.firstError || 'Please fix the errors in the form.');
      toast.error(message);
      return;
    }

    const activeElement = document.activeElement as HTMLElement | null;
    activeElement?.blur();

    // Let blur-triggered browser scroll settle, then capture final viewport position.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const currentScrollY = window.scrollY;

    // Keep the container height stable while swapping large form markup for payment UI.
    const measuredHeight = swapContainerRef.current?.offsetHeight ?? 0;
    setSwapMinHeight(Math.max(600, measuredHeight));

    setErrors({});
    setShowPaymentForm(true);

    requestAnimationFrame(() => {
      window.scrollTo({ top: currentScrollY, behavior: 'auto' });
    });

    toast.success(`Bank details are ready for $${currentShippingFee.toFixed(2)} shipping payment.`);
  };

  const handleCancelPayment = () => {
    setShowPaymentForm(false);
    setSwapMinHeight(null);
  };

  const handlePaymentSuccess = async () => {
    setLoading(true);
    console.log('Payment confirmation step accepted, submitting sample request...');
    let shouldStopLoading = true;

    try {
      const values = getFormValues();
      // Clean the payload - remove empty strings and undefined values
      const cleanPayload = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== '' && value !== undefined && value !== null)
      );

      const paymentStatus = 'pending';

      // Generate payment confirmation token
      const tokenArray = new Uint8Array(32);
      crypto.getRandomValues(tokenArray);
      const paymentConfirmationToken = Array.from(tokenArray, byte => byte.toString(16).padStart(2, '0')).join('');
      
      const paymentConfirmationTokenExpiry = new Date();
      paymentConfirmationTokenExpiry.setDate(paymentConfirmationTokenExpiry.getDate() + 7); // Token valid for 7 days

      const payload = {
        ...cleanPayload,
        shippingFee: currentShippingFee,
        paymentStatus: paymentStatus,
        paymentConfirmationToken,
        paymentConfirmationTokenExpiry: paymentConfirmationTokenExpiry.toISOString(),
      };

      console.log('Sending payload to API:', payload);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/sample-requests`, payload);

      console.log('API Response:', response.data);

      if (response.data.success) {
        toast.success('Sample request submitted successfully!');
        toast.success('A payment confirmation link has been sent to your email.');

        // Navigate to payment confirmation page
        console.log('Navigating to payment confirmation page with token...');
        shouldStopLoading = false;
        router.push(`/payment-confirmation/${paymentConfirmationToken}`);
        return;
      } else {
        console.error('API returned success: false', response.data);
        toast.error(response.data.message || 'Failed to record sample request after payment.');
      }
    } catch (error: any) {
      console.error('Sample request submission error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        payload: error.config?.data
      });

      // More specific error handling
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message ||
                            error.response.data?.errors?.map((e: any) => e.message).join(', ') ||
                            'Server error occurred';
        toast.error(`Error: ${errorMessage}`);
      } else if (error.request) {
        // Request was made but no response received
        toast.error('Network error: Unable to reach server');
      } else {
        // Something else happened
        toast.error('An unexpected error occurred while finalizing your request');
      }
    } finally {
      if (shouldStopLoading) {
        setLoading(false);
      }
    }
  };

  return (
    <section className="section-padding">
      <div className="container-wide">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-20">
          <div className="lg:col-span-3">
            <div className="mb-8">
              <p className="text-label text-brass mb-4">Sample Request</p>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h2 className="heading-subsection text-foreground">Request Samples</h2>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 px-3 py-1">
                  Shipping: ${currentShippingFee.toFixed(2)}
                </Badge>
              </div>
              <div className="divider-brass mb-6" />
              <p className="text-muted-foreground max-w-2xl">
                Experience our quality firsthand. Order samples of leather materials and finished products before placing
                your bulk order.
              </p>
            </div>

          {formData.productId && formData.productName && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md text-sm border border-blue-200 dark:border-blue-700 mb-8">
              <div className="font-medium text-blue-800 dark:text-blue-200 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Request for: <span className="font-semibold ml-1">{formData.productName}</span>
                {formData.productTypeCategory && (
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                    {formData.productTypeCategory === 'finished-product' ? 'Finished Product' : 'Leather Hides'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-blue-700/80 dark:text-blue-200/80 mt-2">Product details pre-filled from catalog.</p>
            </div>
          )}

            <div
              ref={swapContainerRef}
              className={showPaymentForm ? 'flex items-start md:items-center justify-center py-4 md:py-8' : ''}
              style={{
                minHeight: swapMinHeight ? `${swapMinHeight}px` : undefined,
                overflowAnchor: 'none',
              }}
            >
            {!showPaymentForm ? (
              <form key={formVersion} onSubmit={handleInitiatePayment} className="space-y-8">
                <CompanySection
                  companyName={formData.companyName}
                  contactPerson={formData.contactPerson}
                  email={formData.email}
                  phone={formData.phone}
                  errors={errors}
                  onFieldBlur={handleFieldBlur}
                  companyNameRef={companyNameRef}
                  contactPersonRef={contactPersonRef}
                  emailRef={emailRef}
                  phoneRef={phoneRef}
                />

                <ShippingSection
                  country={formData.country}
                  urgency={formData.urgency}
                  address={formData.address}
                  errors={errors}
                  countriesOptions={countries}
                  urgencyOptions={urgencies}
                  onSelectChange={handleSelectValueChange}
                  onFieldBlur={handleFieldBlur}
                  addressRef={addressRef}
                />

                <SampleRequirementsSection
                  sampleType={formData.sampleType}
                  quantitySamples={formData.quantitySamples}
                  materialPreference={formData.materialPreference}
                  finishType={formData.finishType}
                  colorPreferences={formData.colorPreferences}
                  specificRequests={formData.specificRequests}
                  errors={errors}
                  options={{
                    sampleTypes,
                    quantities,
                    materialPreferences,
                    finishTypes,
                    colorOptions,
                  }}
                  lockProductDerivedFields={Boolean(formData.productId)}
                  onSelectChange={handleSelectValueChange}
                  onFieldBlur={handleFieldBlur}
                  specificRequestsRef={specificRequestsRef}
                />

                <BusinessSection
                  businessType={formData.businessType}
                  intendedUse={formData.intendedUse}
                  futureVolume={formData.futureVolume}
                  options={{
                    businessTypes,
                    intendedUses,
                    futureVolumes,
                  }}
                  onSelectChange={handleSelectValueChange}
                />

                <SubmitSection
                  loading={loading}
                  currentShippingFee={currentShippingFee}
                />
              </form>
            ) : (
              <div className="w-full max-w-3xl rounded-2xl border border-border bg-card/70 backdrop-blur-sm p-5 md:p-8 shadow-sm">
                <div className="mb-6 pb-6 border-b border-border">
                  <p className="text-label text-brass mb-3">Step 2 of 2</p>
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-amber-600" /> Complete Payment
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Transfer the shipping fee and confirm your payment details to finalize this sample request.
                  </p>
                </div>

                <PaymentInstructions
                  shippingFee={currentShippingFee}
                  isSubmitting={loading}
                  onPaymentConfirmed={handlePaymentSuccess}
                  onCancel={handleCancelPayment}
                  paymentInstructions={BANK_PAYMENT_DETAILS}
                />
              </div>
            )}
            </div>
          </div>

          <SampleRequestSidebar />
        </div>
      </div>
    </section>
  );
}

const SampleRequestSidebar = memo(function SampleRequestSidebar() {
  return (
    <div className="lg:col-span-2">
      <div className="mb-8">
        <h2 className="heading-subsection text-foreground mb-4">Why Request Samples?</h2>
        <div className="divider-brass mb-6" />
        <p className="text-muted-foreground">
          Make informed decisions with hands-on experience.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">1</span>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">Quality Verification</h4>
            <p className="text-sm text-muted-foreground">
              Feel the texture, check the thickness, and verify the quality meets your standards.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">2</span>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">Color Matching</h4>
            <p className="text-sm text-muted-foreground">
              Ensure colors match your requirements and see results under different lighting.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">3</span>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">Risk-Free Testing</h4>
            <p className="text-sm text-muted-foreground">
              Test compatibility with production requirements before bulk investment.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-base font-semibold text-foreground mb-4">Sample Process & Timeline</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">1</span>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Request Review</h4>
              <p className="text-sm text-muted-foreground">We review your requirements (2-4 hours).</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">2</span>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Sample Preparation</h4>
              <p className="text-sm text-muted-foreground">Samples are prepared and packaged (24-48 hours).</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">3</span>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Shipping</h4>
              <p className="text-sm text-muted-foreground">Express shipping with tracking (2-7 days).</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">4</span>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Follow-up</h4>
              <p className="text-sm text-muted-foreground">We discuss feedback and next steps.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-bone border border-border dark:bg-muted/30">
        <h4 className="font-serif text-lg font-medium text-foreground mb-2">Sample Costs & Policies</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Leather hides samples: Free (shipping fee applies)</li>
          <li>Finished product samples: Free (shipping fee applies)</li>
          <li>Shipping costs calculated by destination</li>
          <li>Sample costs refunded on first bulk order</li>
          <li>Maximum 10 samples per initial request</li>
          <li>Custom samples may require additional time</li>
        </ul>
      </div>
    </div>
  );
});

// Loading fallback component
function SampleRequestLoading() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-amber-600" />
                <span>Sample Request Form</span>
              </CardTitle>
              <CardDescription>
                Loading form...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default function SampleRequestPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      

      <Suspense fallback={<SampleRequestLoading />}>
        <SampleRequestForm />
      </Suspense>

      <Footer />
    </div>
  );
}