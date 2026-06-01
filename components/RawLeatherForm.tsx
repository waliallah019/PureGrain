"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { IRawLeather, IRawLeatherType } from "@/types/rawLeather"; // Import IRawLeatherType
import { FaPlus, FaTimes, FaUpload, FaTimesCircle } from "react-icons/fa";
import Image from "next/image";
import { toast } from "react-hot-toast";

// Importing Shadcn UI components for styling
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface RawLeatherFormProps {
  rawLeather: IRawLeather | null;
  isAddMode: boolean;
  onSuccess: (rawLeather: IRawLeather, mode: "create" | "update") => void;
  onClose: () => void;
  availableLeatherTypes: IRawLeatherType[]; // NEW PROP
}

// Removed hardcoded leatherTypes here
const animals = ["Cow", "Buffalo", "Goat", "Sheep", "Exotic"];
const finishes = [
  "Aniline",
  "Semi-Aniline",
  "Pigmented",
  "Pull-up",
  "Crazy Horse",
  "Waxed",
  "Nappa",
  "Embossed",
];
const priceUnits = ["per sq.ft.", "per kg"];
const currencies = ["USD", "EUR", "PKR"]; // Example currencies

// Define the type for the formData state explicitly
type FormDataState = {
  name: string;
  leatherType: string;
  animal: string;
  finish: string;
  thickness: string;
  size: string;
  colors: string[];
  minOrderQuantity: string; // Stored as string for form input
  sampleAvailable: boolean;
  description: string;
  isFeatured: boolean; // New
  isArchived: boolean; // New
  pricePerSqFt: string; // New, stored as string for form input
  currency: string; // New
  priceTier: { minQty: string; price: string }[]; // New, minQty/price as strings for input
  priceUnit: string; // New
  discountAvailable: boolean; // New
  negotiable: boolean; // New
};

// Helper to get initial form data, to reduce duplication and ensure defaults
const getInitialFormData = (rawLeather: IRawLeather | null, defaultLeatherType: string): FormDataState => ({
  name: rawLeather?.name || "",
  leatherType: rawLeather?.leatherType || defaultLeatherType, // Use dynamic default
  animal: rawLeather?.animal || animals[0],
  finish: rawLeather?.finish || finishes[0],
  thickness: rawLeather?.thickness || "",
  size: rawLeather?.size || "",
  colors: rawLeather?.colors?.length ? rawLeather.colors : [""],
  minOrderQuantity: rawLeather?.minOrderQuantity?.toString() || "",
  sampleAvailable: rawLeather?.sampleAvailable || false,
  description: rawLeather?.description || "",
  isFeatured: rawLeather?.isFeatured || false, // Default false
  isArchived: rawLeather?.isArchived || false, // Default false
  pricePerSqFt: rawLeather?.pricePerSqFt?.toString() || "",
  currency: rawLeather?.currency || currencies[0],
  priceTier: rawLeather?.priceTier?.length
    ? rawLeather.priceTier.map(tier => ({ minQty: tier.minQty.toString(), price: tier.price.toString() }))
    : [{ minQty: "", price: "" }], // Start with one empty tier
  priceUnit: rawLeather?.priceUnit || priceUnits[0],
  discountAvailable: rawLeather?.discountAvailable || false,
  negotiable: rawLeather?.negotiable || false,
});


export default function RawLeatherForm({
  rawLeather,
  isAddMode,
  onSuccess,
  onClose,
  availableLeatherTypes, // NEW PROP USAGE
}: RawLeatherFormProps) {
  const defaultLeatherType = availableLeatherTypes.length > 0 ? availableLeatherTypes[0].name : "";
  const [formData, setFormData] = useState<FormDataState>(() => getInitialFormData(rawLeather, defaultLeatherType));
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(rawLeather?.images || []);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const loadedRawLeatherId = useRef<string | undefined>(undefined);
  const prevIsAddModeRef = useRef<boolean | null>(isAddMode); // For tracking mode changes

  useEffect(() => {
    // Only reset form if actual rawLeather object or isAddMode has changed in a meaningful way
    const isSwitchingItem = rawLeather?._id !== loadedRawLeatherId.current;
    const isModeChanging = prevIsAddModeRef.current !== isAddMode && prevIsAddModeRef.current !== null;
    const areTypesLoadedAndInitialFormNeedsUpdate = availableLeatherTypes.length > 0 && formData.leatherType === ""; // For add mode only if types load later

    if (isSwitchingItem || isModeChanging || (isAddMode && areTypesLoadedAndInitialFormNeedsUpdate)) {
      console.log("RawLeatherForm: Resetting form due to prop change.");
      setFormData(getInitialFormData(rawLeather, defaultLeatherType));
      setExistingImages(rawLeather?.images || []);
      setImages([]); // Clear any newly added images when switching items or modes
      setErrors({}); // Clear validation errors
      setLoading(false); // Reset loading state
    }
    // Update refs for the next render cycle
    loadedRawLeatherId.current = rawLeather?._id;
    prevIsAddModeRef.current = isAddMode;
  }, [rawLeather, isAddMode, availableLeatherTypes, defaultLeatherType]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const target = e.target as HTMLInputElement;

    setFormData((prev) => {
      const newState: FormDataState = { ...prev };
      const propName = name as keyof FormDataState;

      if (type === "checkbox") {
        if (typeof newState[propName] === 'boolean') {
            (newState[propName] as boolean) = target.checked;
        } else {
            console.warn(`Checkbox input '${name}' is not tied to a boolean state property.`);
        }
      } else {
        if (typeof newState[propName] === 'string' || typeof newState[propName] === 'number') {
            (newState[propName] as string) = value;
        } else {
            console.warn(`Input '${name}' is not tied to a string or number state property.`);
        }
      }
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" })); // Clear specific error

      return newState;
    });
  };

  const handleSelectChange = (name: keyof FormDataState, value: string) => {
    setFormData((prev) => {
      const newState = { ...prev, [name]: value };
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" })); // Clear error
      return newState;
    });
  };

  const handleColorChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newColors = [...formData.colors];
    newColors[index] = e.target.value;
    setFormData((prev) => ({ ...prev, colors: newColors }));
    if (errors.colors) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.colors;
        return newErrors;
      });
    }
  };

  const addColor = () => {
    if (formData.colors.length > 0 && formData.colors[formData.colors.length - 1].trim() === "") {
        toast.error("Please fill the current color field before adding another.");
        return;
    }
    setFormData((prev) => ({
        ...prev,
        colors: [...prev.colors, ""],
    }));
  };

  const removeColor = (index: number) => {
    const newColors = formData.colors.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      colors: newColors.length === 0 ? [""] : newColors,
    }));
    if (errors.colors) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.colors;
        return newErrors;
      });
    }
  };

  // Price Tier Handlers
  const handlePriceTierChange = (index: number, field: 'minQty' | 'price', e: React.ChangeEvent<HTMLInputElement>) => {
    const newPriceTiers = [...formData.priceTier];
    newPriceTiers[index][field] = e.target.value;
    setFormData(prev => ({ ...prev, priceTier: newPriceTiers }));
    if (errors.priceTier) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors.priceTier; return newErrors; });
    }
  };

  const addPriceTier = () => {
    if (formData.priceTier.length > 0) {
      const lastTier = formData.priceTier[formData.priceTier.length - 1];
      if (lastTier.minQty.trim() === "" || lastTier.price.trim() === "") {
        toast.error("Please fill the current price tier before adding another.");
        return;
      }
    }
    setFormData(prev => ({ ...prev, priceTier: [...prev.priceTier, { minQty: "", price: "" }] }));
  };

  const removePriceTier = (index: number) => {
    const newPriceTiers = formData.priceTier.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      priceTier: newPriceTiers.length === 0 ? [{ minQty: "", price: "" }] : newPriceTiers,
    }));
    if (errors.priceTier) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors.priceTier; return newErrors; });
    }
  };


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalImagesCount =
        images.length + existingImages.length + newFiles.length;

      if (totalImagesCount > 10) {
        toast.error(
          `You can upload a maximum of 10 images. You are trying to add ${newFiles.length} new images, which would result in ${totalImagesCount} total.`
        );
        e.target.value = "";
        return;
      }
      setImages((prev) => [...prev, ...newFiles]);
      e.target.value = "";
      setErrors((prev) => ({ ...prev, images: "" }));
    }
  };

  const removeImage = (index: number) => {
    if (images.length + existingImages.length <= 1) {
      toast.error("A leather hides entry must have at least one image.");
      return;
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (errors.images) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  };

  const removeExistingImage = async (imageUrl: string) => {
    if (
      !rawLeather ||
      !window.confirm("Are you sure you want to remove this image?")
    ) {
      return;
    }
    if (existingImages.length + images.length <= 1) {
      toast.error("Cannot remove the last image. A leather hides must have at least one image.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/raw-leather/${rawLeather._id}/remove-images`,
        { imageUrls: [imageUrl] }
      );
      if (response.data.success) {
        setExistingImages((prev) => prev.filter((img) => img !== imageUrl));
        toast.success("Image removed successfully!");
        if (errors.images) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.images;
            return newErrors;
          });
        }
      } else {
        throw new Error(response.data.message || "Failed to remove image.");
      }
    } catch (error: any) {
      console.error(
        "Error removing image:",
        error.response?.data || error.message
      );
      toast.error(
        `Failed to remove image: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    // Validate leatherType using availableLeatherTypes
    if (!formData.leatherType.trim()) {
      newErrors.leatherType = "Leather Type is required.";
    } else if (!availableLeatherTypes.some(type => type.name === formData.leatherType)) {
      newErrors.leatherType = "Invalid Leather Type selected.";
    }

    if (!formData.animal || !animals.includes(formData.animal)) newErrors.animal = "Invalid Animal type selected.";
    if (!formData.finish || !finishes.includes(formData.finish)) newErrors.finish = "Invalid Finish type selected.";

    if (!formData.thickness.trim()) newErrors.thickness = "Thickness is required.";
    if (!formData.size.trim()) newErrors.size = "Size is required.";
    if (
      isNaN(parseFloat(formData.minOrderQuantity)) ||
      parseFloat(formData.minOrderQuantity) < 1
    ) {
      newErrors.minOrderQuantity = "Min Order Quantity must be a positive number.";
    }
    if (!formData.description.trim())
      newErrors.description = "Description is required.";
    
    // New fields validation
    if (isNaN(parseFloat(formData.pricePerSqFt)) || parseFloat(formData.pricePerSqFt) < 0) {
      newErrors.pricePerSqFt = "Price per sq. ft. must be a non-negative number.";
    }
    if (!formData.currency.trim()) newErrors.currency = "Currency is required.";
    if (!formData.priceUnit.trim()) newErrors.priceUnit = "Price unit is required.";

    // Price tier validation
    const nonEmptyPriceTiers = formData.priceTier.filter(tier => tier.minQty.trim() !== "" && tier.price.trim() !== "");
    if (nonEmptyPriceTiers.length > 0) {
      nonEmptyPriceTiers.forEach((tier, index) => {
        if (isNaN(parseInt(tier.minQty)) || parseInt(tier.minQty) < 1) {
          newErrors.priceTier = (newErrors.priceTier || "") + `Tier ${index + 1}: Min Quantity must be a positive integer. `;
        }
        if (isNaN(parseFloat(tier.price)) || parseFloat(tier.price) < 0) {
          newErrors.priceTier = (newErrors.priceTier || "") + `Tier ${index + 1}: Price must be a non-negative number. `;
        }
      });
      // Check for empty rows in the middle
      if (formData.priceTier.length > nonEmptyPriceTiers.length && (formData.priceTier.some(t => (t.minQty.trim() === "" || t.price.trim() === "") && t !== formData.priceTier[formData.priceTier.length -1]))) {
         newErrors.priceTier = (newErrors.priceTier || "") + "Please fill all price tier fields or remove empty rows.";
      }
    } else if (formData.priceTier.length === 1 && (formData.priceTier[0].minQty.trim() !== "" || formData.priceTier[0].price.trim() !== "")) {
        // If there's only one tier and it's partially filled, it's an error.
        newErrors.priceTier = "Please ensure the first price tier is fully filled or left empty.";
    }


    const nonEmptyColors = formData.colors.filter(c => c.trim() !== "");
    if (nonEmptyColors.length === 0) {
      newErrors.colors = "At least one color is required.";
    } else if (formData.colors.length > nonEmptyColors.length && formData.colors[formData.colors.length -1].trim() === "") {
      newErrors.colors = "Please fill all color fields or remove empty ones.";
    }

    const totalImages = images.length + existingImages.length;
    if (totalImages === 0) {
      newErrors.images = "At least one image is required for the entry.";
    } else if (totalImages > 10) {
      newErrors.images = `Maximum 10 images allowed. You have ${totalImages}.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, images.length, existingImages.length, availableLeatherTypes]); // Added availableLeatherTypes to dependencies

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();

      // Filter out empty color variants and price tiers before sending
      const filteredColors = formData.colors.filter(c => c.trim() !== "");
      const filteredPriceTiers = formData.priceTier.filter(tier => tier.minQty.trim() !== "" && tier.price.trim() !== "");


      // Append all formData fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "colors") {
          filteredColors.forEach((color: string) => {
            data.append("colors[]", color);
          });
        } else if (key === "priceTier") {
            // Price tiers need to be stringified as an array of objects
            // Backend will JSON.parse this and Zod will validate
            data.append("priceTier", JSON.stringify(filteredPriceTiers));
        } else if (typeof value === "boolean") { // Handle all boolean fields
          data.append(key, String(value));
        } else { // All other fields (string, number as string)
          data.append(key, String(value));
        }
      });

      images.forEach((file) => {
        data.append("images", file);
      });

      const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/raw-leather${
        rawLeather ? `/${rawLeather._id}` : ""
      }`;
      const method = rawLeather ? "PUT" : "POST";

      const response = await axios({
        method: method,
        url: url,
        data: data,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        onSuccess(response.data.data, isAddMode ? "create" : "update");
        toast.success(
          isAddMode
            ? "Leather hides entry created successfully!"
            : "Leather hides entry updated successfully!"
        );
      } else {
        throw new Error(response.data.message || "Operation failed.");
      }
    } catch (error: any) {
      console.error("Submission catch block error:", error);

      let errorMessage = "An unexpected error occurred.";
      let detailedErrors: { [key: string]: string } = {};

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const backendResponse = error.response.data;

          if (
            backendResponse &&
            backendResponse.errors &&
            Array.isArray(backendResponse.errors)
          ) {
            detailedErrors = backendResponse.errors.reduce(
              (acc: any, err: any) => {
                const path = Array.isArray(err.path)
                  ? err.path.join(".")
                  : err.path;
                const fieldName = path.startsWith("body.")
                  ? path.substring(5)
                  : path;
                acc[fieldName] = err.message;
                return acc;
              },
              {}
            );
            errorMessage = "Validation failed. Please check your inputs.";
          } else if (backendResponse && backendResponse.message) {
            errorMessage = backendResponse.message;
          } else {
            errorMessage = `Server Error: ${error.response.status} ${
              error.response.statusText || "Unknown Status"
            }`;
          }
        } else if (error.request) {
          errorMessage =
            "Network Error: No response from server. Please check your internet connection or if the API is running.";
        } else {
          errorMessage = `Request Setup Error: ${error.message}`;
        }
      } else {
        errorMessage = `Unexpected Client Error: ${error.message}`;
      }

      setErrors(detailedErrors);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div
  data-lenis-prevent
  className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6" // REMOVE max-h and overflow-y-auto
>
        <div className="md:col-span-1 space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-muted-foreground"
            >
              Leather Hides Name
            </label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="leatherType"
              className="block text-sm font-medium text-muted-foreground"
            >
              Leather Type
            </label>
            <Select
              value={formData.leatherType}
              onValueChange={(value) => handleSelectChange("leatherType", value)}
            >
              <SelectTrigger
                className={errors.leatherType ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select a leather type">{formData.leatherType}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {/* Fixed: Removed the SelectItem with empty string value */}
                {availableLeatherTypes.length === 0 ? (
                    <SelectItem value="no-types-available" disabled>No types available. Add one first.</SelectItem>
                ) : (
                    availableLeatherTypes.map((type) => (
                        <SelectItem key={type._id} value={type.name}>
                            {type.name}
                        </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
            {errors.leatherType && (
              <p className="text-red-500 text-xs mt-1">{errors.leatherType}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="animal"
              className="block text-sm font-medium text-muted-foreground"
            >
              Animal
            </label>
            <Select
              value={formData.animal}
              onValueChange={(value) => handleSelectChange("animal", value)}
            >
              <SelectTrigger className={errors.animal ? "border-red-500" : ""}>
                <SelectValue placeholder="Select an animal">{formData.animal}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {animals.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.animal && (
              <p className="text-red-500 text-xs mt-1">{errors.animal}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="finish"
              className="block text-sm font-medium text-muted-foreground"
            >
              Finish
            </label>
            <Select
              value={formData.finish}
              onValueChange={(value) => handleSelectChange("finish", value)}
            >
              <SelectTrigger className={errors.finish ? "border-red-500" : ""} >
                <SelectValue placeholder="Select a finish">{formData.finish}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {finishes.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.finish && (
              <p className="text-red-500 text-xs mt-1">{errors.finish}</p>
            )}
          </div>

          <div>
            <label htmlFor="pricePerSqFt" className="block text-sm font-medium text-muted-foreground">
              Price Per Sq. Ft.
            </label>
            <Input
              type="number"
              id="pricePerSqFt"
              name="pricePerSqFt"
              value={formData.pricePerSqFt}
              onChange={handleChange}
              step="0.01"
              className={errors.pricePerSqFt ? "border-red-500" : ""}
            />
            {errors.pricePerSqFt && <p className="text-red-500 text-xs mt-1">{errors.pricePerSqFt}</p>}
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-muted-foreground">
              Currency
            </label>
            <Select
              value={formData.currency}
              onValueChange={(value) => handleSelectChange("currency", value)}
            >
              <SelectTrigger className={errors.currency ? "border-red-500" : ""}>
                <SelectValue placeholder="Select currency">{formData.currency}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.currency && <p className="text-red-500 text-xs mt-1">{errors.currency}</p>}
          </div>

        </div>

        <div className="md:col-span-1 space-y-6">
          <div>
            <label
              htmlFor="thickness"
              className="block text-sm font-medium text-muted-foreground"
            >
              Thickness (e.g., 1.2-1.4mm)
            </label>
            <Input
              type="text"
              id="thickness"
              name="thickness"
              value={formData.thickness}
              onChange={handleChange}
              className={errors.thickness ? "border-red-500" : ""}
            />
            {errors.thickness && (
              <p className="text-red-500 text-xs mt-1">{errors.thickness}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="size"
              className="block text-sm font-medium text-muted-foreground"
            >
              Size (e.g., 50 sq. ft. per hide)
            </label>
            <Input
              type="text"
              id="size"
              name="size"
              value={formData.size}
              onChange={handleChange}
              className={errors.size ? "border-red-500" : ""}
            />
            {errors.size && (
              <p className="text-red-500 text-xs mt-1">{errors.size}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              Colors
            </label>
            {formData.colors.map((color, index) => (
              <div key={`color-${index}`} className="flex items-center mt-2">
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => handleColorChange(index, e)}
                  placeholder="e.g., Black"
                  className={errors.colors ? "border-red-500" : ""}
                />
                {(formData.colors.length > 1 || color.trim() !== "") && (
                  <Button
                    type="button"
                    onClick={() => removeColor(index)}
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                  >
                    <FaTimes />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              onClick={addColor}
              variant="outline"
              className="mt-2 flex items-center gap-1"
            >
              <FaPlus size={14} /> Add Color
            </Button>
            {errors.colors && (
              <p className="text-red-500 text-xs mt-1">{errors.colors}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="minOrderQuantity"
              className="block text-sm font-medium text-muted-foreground"
            >
              Minimum Order Quantity
            </label>
            <Input
              type="number"
              id="minOrderQuantity"
              name="minOrderQuantity"
              value={formData.minOrderQuantity}
              onChange={handleChange}
              className={errors.minOrderQuantity ? "border-red-500" : ""}
            />
            {errors.minOrderQuantity && (
              <p className="text-red-500 text-xs mt-1">
                {errors.minOrderQuantity}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="priceUnit" className="block text-sm font-medium text-muted-foreground">
              Price Unit
            </label>
            <Select
              value={formData.priceUnit}
              onValueChange={(value) => handleSelectChange("priceUnit", value)}
            >
              <SelectTrigger className={errors.priceUnit ? "border-red-500" : ""}>
                <SelectValue placeholder="Select price unit">{formData.priceUnit}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {priceUnits.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.priceUnit && <p className="text-red-500 text-xs mt-1">{errors.priceUnit}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              Price Tiers
            </label>
            {formData.priceTier.map((tier, index) => (
              <div key={`tier-${index}`} className="flex items-center mt-2 space-x-2">
                <Input
                  type="number"
                  placeholder="Min Qty"
                  value={tier.minQty}
                  onChange={(e) => handlePriceTierChange(index, 'minQty', e)}
                  className={`w-1/2 ${errors.priceTier ? "border-red-500" : ""}`}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={tier.price}
                  onChange={(e) => handlePriceTierChange(index, 'price', e)}
                  step="0.01"
                  className={`w-1/2 ${errors.priceTier ? "border-red-500" : ""}`}
                />
                {(formData.priceTier.length > 1 || (tier.minQty.trim() !== "" || tier.price.trim() !== "")) && (
                  <Button
                    type="button"
                    onClick={() => removePriceTier(index)}
                    variant="ghost"
                    size="icon"
                  >
                    <FaTimes />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              onClick={addPriceTier}
              variant="outline"
              className="mt-2 flex items-center gap-1"
            >
              <FaPlus size={14} /> Add Price Tier
            </Button>
            {errors.priceTier && <p className="text-red-500 text-xs mt-1">{errors.priceTier}</p>}
          </div>

        </div>
      </div>
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-muted-foreground"
        >
          Description
        </label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className={errors.description ? "border-red-500" : ""}
        ></Textarea>
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description}</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-3 sm:space-y-0">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isFeatured"
            name="isFeatured"
            checked={formData.isFeatured}
            onChange={handleChange}
            className="h-4 w-4 rounded border border-input text-primary focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:checked:bg-primary dark:checked:border-primary"
          />
          <label htmlFor="isFeatured" className="ml-2 block text-sm text-foreground">
            Featured
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isArchived"
            name="isArchived"
            checked={formData.isArchived}
            onChange={handleChange}
            className="h-4 w-4 rounded border border-input text-primary focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:checked:bg-primary dark:checked:border-primary"
          />
          <label htmlFor="isArchived" className="ml-2 block text-sm text-foreground">
            Archived
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="sampleAvailable"
            name="sampleAvailable"
            checked={formData.sampleAvailable}
            onChange={handleChange}
            className="h-4 w-4 rounded border border-input text-primary focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:checked:bg-primary dark:checked:border-primary"
          />
          <label htmlFor="sampleAvailable" className="ml-2 block text-sm text-foreground">
            Sample Available
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="discountAvailable"
            name="discountAvailable"
            checked={formData.discountAvailable}
            onChange={handleChange}
            className="h-4 w-4 rounded border border-input text-primary focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:checked:bg-primary dark:checked:border-primary"
          />
          <label htmlFor="discountAvailable" className="ml-2 block text-sm text-foreground">
            Discount Available
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="negotiable"
            name="negotiable"
            checked={formData.negotiable}
            onChange={handleChange}
            className="h-4 w-4 rounded border border-input text-primary focus:ring-primary focus:ring-offset-2 dark:border-gray-600 dark:checked:bg-primary dark:checked:border-primary"
          />
          <label htmlFor="negotiable" className="ml-2 block text-sm text-foreground">
            Negotiable Price
          </label>
        </div>
      </div>

      <div className="relative group w-full pt-4">
        <label
          htmlFor="images"
          className="block text-sm font-medium text-muted-foreground mb-2"
        >
          Leather Hides Images (Max 10)
        </label>
        <input
          type="file"
          id="images"
          name="images"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        <label
          htmlFor="images"
          className={`
            relative inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium
            ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
            disabled:pointer-events-none disabled:opacity-50
            cursor-pointer flex items-center justify-center gap-2
            ${
              errors.images
                ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                : ""
            }
            dark:border-input dark:bg-background dark:hover:bg-accent dark:hover:text-accent-foreground
          `}
        >
          <FaUpload /> Select Images
        </label>
        {errors.images && (
          <p className="text-red-500 text-xs mt-1">{errors.images}</p>
        )}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {existingImages.map((imageUrl, index) => (
            <div
              key={`existing-${index}`}
              className="relative aspect-square w-full overflow-hidden rounded-md border shadow-sm group dark:border-gray-700"
            >
              <Image
                src={imageUrl}
                alt={`Leather hides existing image ${index + 1}`}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              />
              <Button
                type="button"
                onClick={() => removeExistingImage(imageUrl)}
                className="absolute right-1 top-1 rounded-full p-1 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                title="Remove image"
                variant="destructive"
                size="icon"
                disabled={loading}
              >
                <FaTimesCircle />
              </Button>
            </div>
          ))}
          {images.map((file, index) => (
            <div
              key={`new-${index}`}
              className="relative aspect-square w-full overflow-hidden rounded-md border shadow-sm group dark:border-gray-700"
            >
              <Image
                src={URL.createObjectURL(file)}
                alt={`Leather hides new image ${index + 1}`}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              />
              <Button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-1 top-1 rounded-full p-1 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                title="Remove image"
                variant="destructive"
                size="icon"
                disabled={loading}
              >
                <FaTimesCircle />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end space-x-3 mt-8">
        <Button
          type="button"
          onClick={onClose}
          disabled={loading}
          variant="outline"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <svg
              className="h-5 w-5 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <span>{isAddMode ? "Create Leather Hides" : "Save Changes"}</span>
          )}
        </Button>
      </div>
    </form>
  );
}