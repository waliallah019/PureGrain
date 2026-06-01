"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { IProduct, IProductType } from "@/types/product"; // Make sure IProduct and IProductType is updated!
import { FaPlus, FaTimes, FaUpload, FaTimesCircle } from "react-icons/fa";
import Image from "next/image";
import { toast } from "react-hot-toast";

interface ProductFormProps {
  product: IProduct | null;
  isAddMode: boolean;
  onSuccess: (product: IProduct, mode: "create" | "update") => void;
  onClose: () => void;
  availableProductTypes: IProductType[]; // NEW PROP: Array of fetched product types
}

const priceUnits = ["per piece", "per dozen", "per set", "per pair", "per unit"]; // Example units

const availabilityOptions = ["In Stock", "Made to Order", "Limited Stock"];

// Define the type for the formData state explicitly
type FormDataState = {
  name: string;
  productType: string;
  materialUsed: string;
  dimensions: string;
  moq: string;
  colorVariants: string[];
  description: string;
  isFeatured: boolean;
  pricePerUnit: string;
  priceUnit: string;
  currency: string;
  availability: string;
  stockCount: string;
  category: string;
  tags: string[];
  isActive: boolean;
  isArchived: boolean;
  sampleAvailable: boolean; // NEW: Add sampleAvailable to FormDataState
};

export default function ProductForm({
  product,
  isAddMode,
  onSuccess,
  onClose,
  availableProductTypes, // NEW: Destructure the prop
}: ProductFormProps) {
  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    // Initialize productType with the first available type or an empty string
    productType: availableProductTypes.length > 0 ? availableProductTypes[0].name : "",
    materialUsed: "",
    dimensions: "",
    moq: "",
    colorVariants: [""],
    description: "",
    isFeatured: false,
    pricePerUnit: "",
    priceUnit: priceUnits[0],
    currency: "USD",
    availability: availabilityOptions[0],
    stockCount: "",
    category: "",
    tags: [""],
    isActive: true,
    isArchived: false,
    sampleAvailable: false,
  });
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        productType: product.productType, // Use product's type
        materialUsed: product.materialUsed,
        dimensions: product.dimensions,
        moq: product.moq.toString(),
        colorVariants: product.colorVariants.length
          ? product.colorVariants
          : [""],
        description: product.description,
        isFeatured: product.isFeatured,
        pricePerUnit: product.pricePerUnit.toString(),
        priceUnit: product.priceUnit,
        currency: product.currency,
        availability: product.availability,
        stockCount: product.stockCount.toString(),
        category: product.category || "",
        tags: product.tags.length ? product.tags : [""],
        isActive: product.isActive,
        isArchived: product.isArchived,
        sampleAvailable: product.sampleAvailable || false,
      });
      setExistingImages(product.images || []);
    } else {
      // Reset for add mode
      setFormData({
        name: "",
        // Default to first available type for new products if any, else empty string
        productType: availableProductTypes.length > 0 ? availableProductTypes[0].name : "",
        materialUsed: "",
        dimensions: "",
        moq: "",
        colorVariants: [""],
        description: "",
        isFeatured: false,
        pricePerUnit: "",
        priceUnit: priceUnits[0],
        currency: "USD",
        availability: availabilityOptions[0],
        stockCount: "",
        category: "",
        tags: [""],
        isActive: true,
        isArchived: false,
        sampleAvailable: false,
      });
      setImages([]);
      setExistingImages([]);
    }
    setErrors({}); // Clear errors when product changes or mode changes
  }, [product, isAddMode, availableProductTypes]); // DEPENDENCY ADDED

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const target = e.target as HTMLInputElement;

    setFormData((prev) => {
      // Create a mutable copy of the previous state
      const newState: FormDataState = { ...prev };

      // Ensure 'name' is a valid key of FormDataState
      const propName = name as keyof FormDataState;

      // Handle checkbox inputs
      if (type === "checkbox") {
        if (typeof newState[propName] === 'boolean') {
            (newState[propName] as boolean) = target.checked;

            // --- Consistency Logic for isActive/isArchived ---
            if (propName === "isArchived" && target.checked) {
              newState.isActive = false; // If archived, it cannot be active
            } else if (propName === "isActive" && target.checked) {
              newState.isArchived = false; // If made active, it cannot be archived
            }
            // --- End Consistency Logic ---

        } else {
            console.warn(`Checkbox input '${name}' is not tied to a boolean state property.`);
        }
      } else {
        // Handle text, number, select, textarea inputs (values are always strings initially)
        if (typeof newState[propName] === 'string' || typeof newState[propName] === 'number') {
            // All these form values from event.target.value are strings initially
            (newState[propName] as string) = value;
        } else {
             console.warn(`Input '${name}' is not tied to a string or number state property.`);
        }
      }

      // If availability changes, and it's "Made to Order", reset stockCount
      if (propName === "availability" && value === "Made to Order") {
        newState.stockCount = "0"; // stockCount is a string in formDataState
      }

      return newState;
    });
    setErrors((prev) => ({ ...prev, [name]: "" })); // Clear specific error on change
  };

  const handleArrayFieldChange = (
    fieldName: "colorVariants" | "tags",
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newArray = [...formData[fieldName]];
    newArray[index] = e.target.value;
    setFormData((prev) => ({ ...prev, [fieldName]: newArray }));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const addArrayFieldItem = (fieldName: "colorVariants" | "tags") => {
    const currentArray = formData[fieldName];
    if (
      currentArray.length === 0 ||
      currentArray[currentArray.length - 1].trim() !== ""
    ) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: [...prev[fieldName], ""],
      }));
    } else {
      toast.error(`Please fill the current ${fieldName.slice(0, -1)} field before adding another.`);
    }
  };

  const removeArrayFieldItem = (fieldName: "colorVariants" | "tags", index: number) => {
    const newArray = formData[fieldName].filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      [fieldName]: newArray.length === 0 ? [""] : newArray,
    }));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalImagesCount = images.length + existingImages.length + newFiles.length;

      if (totalImagesCount > 10) {
        toast.error(`You can upload a maximum of 10 images. You are trying to add ${newFiles.length} new images, which would result in ${totalImagesCount} total.`);
        e.target.value = ""; // Clear selected files
        return;
      }
      setImages((prev) => [...prev, ...newFiles]);
      e.target.value = ""; // Clear input to allow selecting same file again
      setErrors((prev) => ({ ...prev, images: "" })); // Clear image error
    }
  };

  const removeImage = (index: number) => {
    // Prevent removing the last image if it's the only one left (new or existing)
    if (images.length + existingImages.length <= 1) {
      toast.error("A product must have at least one image.");
      return;
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
    // Clear image error if applicable
    if (errors.images) {
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.images;
            return newErrors;
        });
    }
  };

  const removeExistingImage = async (imageUrl: string) => {
    if (!product) return;

    // Prevent removing the last image if it's the only one left (new or existing)
    if (existingImages.length + images.length <= 1) {
      toast.error("Cannot remove the last image. A product must have at least one image.");
      return;
    }

    if (!window.confirm("Are you sure you want to remove this image?")) {
      return;
    }
    setLoading(true);
    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/finished-products/${product._id}/remove-images`,
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
      console.error("Error removing image:", error.response?.data || error.message);
      toast.error(`Failed to remove image: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    // Ensure productType is selected if availableProductTypes exist
    if (!formData.productType.trim() && availableProductTypes.length > 0) {
      newErrors.productType = "Product Type is required.";
    }
    if (!formData.materialUsed.trim()) newErrors.materialUsed = "Material Used is required.";
    if (!formData.dimensions.trim()) newErrors.dimensions = "Dimensions are required.";
    if (isNaN(parseFloat(formData.pricePerUnit)) || parseFloat(formData.pricePerUnit) <= 0) {
      newErrors.pricePerUnit = "Price per unit must be a positive number.";
    }
    if (!formData.priceUnit.trim()) newErrors.priceUnit = "Price unit is required.";
    if (isNaN(parseInt(formData.moq)) || parseInt(formData.moq) < 1) {
      newErrors.moq = "MOQ must be a positive number.";
    }
    if (!formData.description.trim()) newErrors.description = "Description is required.";

    // Only validate stockCount if availability is not "Made to Order"
    if (formData.availability !== "Made to Order" && (isNaN(parseInt(formData.stockCount)) || parseInt(formData.stockCount) < 0)) {
      newErrors.stockCount = "Stock count must be a non-negative number.";
    }


    // Validate color variants
    const hasEmptyColorVariant = formData.colorVariants.some(v => v.trim() === "");
    if (formData.colorVariants.length > 1 && hasEmptyColorVariant) {
        newErrors.colorVariants = "Please fill all color variant fields or remove empty ones.";
    } else if (formData.colorVariants.length === 1 && formData.colorVariants[0].trim() === "") {
        newErrors.colorVariants = "At least one color variant is required.";
    }

    // Validate tags
    const hasEmptyTag = formData.tags.some(t => t.trim() === "");
    if (formData.tags.length > 1 && hasEmptyTag) {
        newErrors.tags = "Please fill all tag fields or remove empty ones.";
    } else if (formData.tags.length === 1 && formData.tags[0].trim() === "") {
        newErrors.tags = "At least one tag is recommended."; // Or make it required if needed
    }


    const totalImages = images.length + existingImages.length;
    if (totalImages === 0) {
      newErrors.images = "At least one image is required for the product.";
    } else if (totalImages > 10) {
      newErrors.images = `Maximum 10 images allowed. You have ${totalImages}.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); // Clear errors at the start of submission
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setLoading(true);
    try {
      // Create a mutable copy of formData to adjust before sending
      let dataToSend = { ...formData };

      // Force stockCount to 0 if availability is "Made to Order"
      if (dataToSend.availability === "Made to Order") {
        dataToSend.stockCount = "0";
      }

      const data = new FormData();
      
      // Filter out empty color variants and tags before sending
      const filteredColorVariants = dataToSend.colorVariants.filter(v => v.trim() !== "");
      const filteredTags = dataToSend.tags.filter(t => t.trim() !== "");

      // Loop through FormDataState keys and append to FormData
      // Explicitly iterate to ensure all fields, including new ones like sampleAvailable, are added.
      for (const key in dataToSend) {
        if (Object.prototype.hasOwnProperty.call(dataToSend, key)) {
          const value = dataToSend[key as keyof FormDataState];

          if (key === "colorVariants") {
            filteredColorVariants.forEach((color: string) => {
              data.append("colorVariants[]", color);
            });
          } else if (key === "tags") {
            filteredTags.forEach((tag: string) => {
              data.append("tags[]", tag);
            });
          }
          // Handle boolean fields by converting to string "true" or "false"
          else if (key === "isFeatured" || key === "isActive" || key === "isArchived" || key === "sampleAvailable") {
            data.append(key, String(value));
          }
          // Append other fields normally
          else {
            data.append(key, String(value));
          }
        }
      }

      images.forEach((file) => {
        data.append("images", file);
      });

      const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/finished-products${
        product ? `/${product._id}` : ""
      }`;
      const method = product ? "PUT" : "POST";

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
          isAddMode ? "Product created successfully!" : "Product updated successfully!"
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

          if (backendResponse && backendResponse.errors && Array.isArray(backendResponse.errors)) {
            detailedErrors = backendResponse.errors.reduce((acc: any, err: any) => {
              const path = Array.isArray(err.path) ? err.path.join('.') : err.path;
              const fieldName = path.startsWith('body.') ? path.substring(5) : path;
              acc[fieldName] = err.message;
              return acc;
            }, {});
            errorMessage = "Validation failed. Please check your inputs.";
          } else if (backendResponse && backendResponse.message) {
            errorMessage = backendResponse.message;
          } else {
            errorMessage = `Server Error: ${error.response.status} ${error.response.statusText || 'Unknown Status'}`;
          }
        } else if (error.request) {
          errorMessage = "Network Error: No response from server. Please check your internet connection or if the API is running.";
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
        className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
      >
        {/* Left Column Fields */}
        <div className="md:col-span-1 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">
              Product Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`mt-1 block w-full border
                ${errors.name ? 'border-red-500' : 'border-input focus-visible:ring-ring'}
                rounded-md shadow-sm p-2 bg-background text-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                dark:border-input dark:focus-visible:ring-ring dark:bg-background dark:text-foreground
                dark:placeholder:text-muted-foreground
              `}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="productType" className="block text-sm font-medium text-muted-foreground">
              Product Type
            </label>
            <select
              id="productType"
              name="productType"
              value={formData.productType}
              onChange={handleChange}
              className={`mt-1 block w-full border
                ${errors.productType ? 'border-red-500' : 'border-input focus-visible:ring-ring'}
                rounded-md shadow-sm p-2 bg-background text-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                appearance-none pr-8 cursor-pointer
                dark:border-input dark:focus-visible:ring-ring dark:bg-background dark:text-foreground
                dark:placeholder:text-muted-foreground
              `}
            >
              {/* Conditional rendering for placeholder or first available type */}
              {availableProductTypes.length === 0 ? (
                <option value="" disabled>No types available. Add one first.</option>
              ) : (
                <>
                  {/* Optional: Add a default "Select a type" option */}
                  <option value="">Select a Product Type</option>
                  {availableProductTypes.map((type) => (
                    <option key={type._id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {errors.productType && <p className="text-red-500 text-xs mt-1">{errors.productType}</p>}
          </div>

          <div>
            <label htmlFor="materialUsed" className="block text-sm font-medium text-muted-foreground">
              Material Used
            </label>
            <input
              type="text"
              id="materialUsed"
              name="materialUsed"
              value={formData.materialUsed}
              onChange={handleChange}
              className={`mt-1 block w-full border
                ${errors.materialUsed ? 'border-red-500' : 'border-input focus-visible:ring-ring'}
                rounded-md shadow-sm p-2 bg-background text-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                dark:border-input dark:focus-visible:ring-ring dark:bg-background dark:text-foreground
                dark:placeholder:text-muted-foreground
              `}
            />
            {errors.materialUsed && <p className="text-red-500 text-xs mt-1">{errors.materialUsed}</p>}
          </div>

          <div>
            <label htmlFor="dimensions" className="block text-sm font-medium text-muted-foreground">
              Dimensions
            </label>
            <input
              type="text"
              id="dimensions"
              name="dimensions"
              value={formData.dimensions}
              onChange={handleChange}
              className={`mt-1 block w-full border
                ${errors.dimensions ? 'border-red-500' : 'border-input focus-visible:ring-ring'}
                rounded-md shadow-sm p-2 bg-background text-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                dark:border-input dark:focus-visible:ring-ring dark:bg-background dark:text-foreground
                dark:placeholder:text-muted-foreground
              `}
            />
            {errors.dimensions && <p className="text-red-500 text-xs mt-1">{errors.dimensions}</p>}
          </div>

          <div>
            <label htmlFor="pricePerUnit" className="block text-sm font-medium text-muted-foreground">
              Price Per Unit
            </label>
            <input
              type="number"
              id="pricePerUnit"
              name="pricePerUnit"
              value={formData.pricePerUnit}
              onChange={handleChange}
              step="0.01"
              className={`mt-1 block w-full border
                ${errors.pricePerUnit ? 'border-red-500' : 'border-input focus-visible:ring-ring'}
                rounded-md shadow-sm p-2 bg-background text-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                dark:border-input dark:focus-visible:ring-ring dark:bg-background dark:text-foreground
                dark:placeholder:text-muted-foreground
              `}
            />
            {errors.pricePerUnit && <p className="text-red-500 text-xs mt-1">{errors.pricePerUnit}</p>}
          </div>

          <div>
            <label htmlFor="priceUnit" className="block text-sm font-medium text-muted-foreground">
              Price Unit
            </label>
            <select
              id="priceUnit"
              name="priceUnit"
              value={formData.priceUnit}
              onChange={handleChange}
              className={`mt-1 block w-full border
                ${errors.priceUnit ? 'border-red-500' : 'border-input focus-visible:ring-ring'}
                rounded-md shadow-sm p-2 bg-background text-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                appearance-none pr-8 cursor-pointer
                dark:border-input dark:focus-visible:ring-ring dark:bg-background dark:text-foreground
                dark:placeholder:text-muted-foreground
              `}
            >
              {priceUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            {errors.priceUnit && <p className="text-red-500 text-xs mt-1">{errors.priceUnit}</p>}
          </div>
                    <div>
            <label className="block text-sm font-medium text-muted-foreground">
              Color Variants
            </label>
            {formData.colorVariants.map((color, index) => (
              <div key={`color-${index}`} className="flex items-center mt-2">
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleArrayFieldChange("colorVariants", index, e)}
                  placeholder="e.g., Black"
                  className={`flex-grow border
                    border-input focus-visible:ring-ring rounded-md shadow-sm p-2 bg-background text-foreground
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                    dark:border-input dark:focus-visible:ring-ring dark:bg-background dark:text-foreground
                    dark:placeholder:text-muted-foreground
                  `}
                />
                {(formData.colorVariants.length > 1 || (formData.colorVariants.length === 1 && color.trim() !== "")) && (
                  <button
                    type="button"
                    onClick={() => removeArrayFieldItem("colorVariants", index)}
                    className="ml-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors
                      hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2
                      dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayFieldItem("colorVariants")}
              className="mt-2 inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background
                px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                dark:border-input dark:bg-background dark:hover:bg-accent dark:hover:text-accent-foreground
                flex items-center gap-1"
            >
              <FaPlus size={14} /> Add Color Variant
            </button>
            {errors.colorVariants && <p className="text-red-500 text-xs mt-1">{errors.colorVariants}</p>}
          </div>

        </div>

        {/* Right Column Fields */}
        <div className="md:col-span-1 space-y-6">
          <div>
            <label htmlFor="moq" className="block text-sm font-medium text-muted-foreground">
              Minimum Order Quantity (MOQ)
            </label>
            <input
              type="number"
              id="moq"
              name="moq"
              value={formData.moq}
              onChange={handleChange}
              className={`mt-1 block w-full border
                ${errors.moq ? 'border-red-500' : 'border-input focus-visible:ring-ring'}
                rounded-md shadow-sm p-2 bg-background text-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                dark:border-input dark:focus-visible:ring-ring dark:bg-background dark:text-foreground
                dark:placeholder:text-muted-foreground
              `}
            />
            {errors.moq && <p className="text-red-500 text-xs mt-1">{errors.moq}</p>}
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-muted-foreground">
              Currency
            </label>
            <input
              type="text"
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className={`mt-1 block w-full border
                ${errors.currency ? 'border-red-500' : 'border-input focus-visible:ring-ring'}
                rounded-md shadow-sm p-2 bg-background text-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                dark:border-input dark:focus-visible:ring-ring dark:bg-background dark:text-foreground
                dark:placeholder:text-muted-foreground
              `}
            />
            {errors.currency && <p className="text-red-500 text-xs mt-1">{errors.currency}</p>}
          </div>

          <div>
            <label htmlFor="availability" className="block text-sm font-medium text-muted-foreground">
              Availability
            </label>
            <select
              id="availability"
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              className={`mt-1 block w-full border
                ${errors.availability ? 'border-red-500' : 'border-input focus-visible:ring-ring'}
                rounded-md shadow-sm p-2 bg-background text-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                appearance-none pr-8 cursor-pointer
                dark:border-input dark:focus-visible:ring-ring dark:bg-background dark:text-foreground
                dark:placeholder:text-muted-foreground
              `}
            >
              {availabilityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.availability && <p className="text-red-500 text-xs mt-1">{errors.availability}</p>}
          </div>

          {formData.availability !== "Made to Order" && ( // Conditional render for stockCount
            <div>
              <label htmlFor="stockCount" className="block text-sm font-medium text-muted-foreground">
                Stock Count
              </label>
              <input
                type="number"
                id="stockCount"
                name="stockCount"
                value={formData.stockCount}
                onChange={handleChange}
                className={`mt-1 block w-full border
                  ${errors.stockCount ? 'border-red-500' : 'border-input focus-visible:ring-ring'}
                  rounded-md shadow-sm p-2 bg-background text-foreground
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                  dark:border-input dark:focus-visible:ring-ring dark:bg-background dark:text-foreground
                  dark:placeholder:text-muted-foreground
                `}
              />
              {errors.stockCount && <p className="text-red-500 text-xs mt-1">{errors.stockCount}</p>}
            </div>
          )}

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-muted-foreground">
              Category (e.g., Men's, Women's, Corporate Gifts)
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`mt-1 block w-full border
                ${errors.category ? 'border-red-500' : 'border-input focus-visible:ring-ring'}
                rounded-md shadow-sm p-2 bg-background text-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                dark:border-input dark:focus-visible:ring-ring dark:bg-background dark:text-foreground
                dark:placeholder:text-muted-foreground
              `}
              placeholder="e.g., Men's"
            />
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground">
              Tags
            </label>
            {formData.tags.map((tag, index) => (
              <div key={`tag-${index}`} className="flex items-center mt-2">
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => handleArrayFieldChange("tags", index, e)}
                  placeholder="e.g., Leather, Handcrafted"
                  className={`flex-grow border
                    border-input focus-visible:ring-ring rounded-md shadow-sm p-2 bg-background text-foreground
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                    dark:border-input dark:focus-visible:ring-ring dark:bg-background dark:text-foreground
                    dark:placeholder:text-muted-foreground
                  `}
                />
                {(formData.tags.length > 1 || (formData.tags.length === 1 && tag.trim() !== "")) && (
                  <button
                    type="button"
                    onClick={() => removeArrayFieldItem("tags", index)}
                    className="ml-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors
                      hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2
                      dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayFieldItem("tags")}
              className="mt-2 inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background
                px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                dark:border-input dark:bg-background dark:hover:bg-accent dark:hover:text-accent-foreground
                flex items-center gap-1"
            >
              <FaPlus size={14} /> Add Tag
            </button>
            {errors.tags && <p className="text-red-500 text-xs mt-1">{errors.tags}</p>}
          </div>

        </div>
      </div>

      {/* Description and Boolean Checkboxes - full width */}
      <div className="space-y-6">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-muted-foreground">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`mt-1 block w-full border
              ${errors.description ? 'border-red-500' : 'border-input focus-visible:ring-ring'}
              rounded-md shadow-sm p-2 bg-background text-foreground
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              dark:border-input dark:focus-visible:ring-ring dark:bg-background dark:text-foreground
              dark:placeholder:text-muted-foreground
            `}
          ></textarea>
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-3 sm:space-y-0">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isFeatured"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
              className="h-4 w-4 border border-gray-300 rounded text-primary
                focus:ring-primary focus:ring-offset-2
                dark:border-gray-600 dark:bg-background dark:checked:bg-primary dark:checked:border-primary dark:focus:ring-primary
                dark:checked:text-primary-foreground
              "
            />
            <label htmlFor="isFeatured" className="ml-2 block text-sm text-foreground cursor-pointer">
              Featured Product
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              disabled={formData.isArchived} // Disable isActive if archived
              className="h-4 w-4 border border-gray-300 rounded text-primary
                focus:ring-primary focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                dark:border-gray-600 dark:bg-background dark:checked:bg-primary dark:checked:border-primary dark:focus:ring-primary
                dark:checked:text-primary-foreground
              "
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-foreground cursor-pointer">
              Active Product
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isArchived"
              name="isArchived"
              checked={formData.isArchived}
              onChange={handleChange}
              disabled={formData.isActive} // Disable isArchived if active
              className="h-4 w-4 border border-gray-300 rounded text-primary
                focus:ring-primary focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                dark:border-gray-600 dark:bg-background dark:checked:bg-primary dark:checked:border-primary dark:focus:ring-primary
                dark:checked:text-primary-foreground
              "
            />
            <label htmlFor="isArchived" className="ml-2 block text-sm text-foreground cursor-pointer">
              Archived Product
            </label>
          </div>
          {/* NEW: Sample Available Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="sampleAvailable"
              name="sampleAvailable"
              checked={formData.sampleAvailable}
              onChange={handleChange}
              className="h-4 w-4 border border-gray-300 rounded text-primary
                focus:ring-primary focus:ring-offset-2
                dark:border-gray-600 dark:bg-background dark:checked:bg-primary dark:checked:border-primary dark:focus:ring-primary
                dark:checked:text-primary-foreground
              "
            />
            <label htmlFor="sampleAvailable" className="ml-2 block text-sm text-foreground cursor-pointer">
              Sample Available
            </label>
          </div>
          {/* END NEW */}
        </div>
      </div>

      {/* Image Upload Section - spans full width on all screen sizes */}
      <div className="relative group w-full pt-4">
        <label htmlFor="images" className="block text-sm font-medium text-muted-foreground mb-2">
          Product Images (Max 10)
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
            ${errors.images ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400' : ''}
            dark:border-input dark:bg-background dark:hover:bg-accent dark:hover:text-accent-foreground
          `}
        >
          <FaUpload /> Select Images
        </label>
        {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {existingImages.map((imageUrl, index) => (
            <div key={`existing-${index}`} className="relative w-full aspect-square border rounded-md overflow-hidden shadow-sm group dark:border-gray-700">
              <Image
                src={imageUrl}
                alt={`Product existing image ${index + 1}`}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              />
              <button
                type="button"
                onClick={() => removeExistingImage(imageUrl)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  dark:bg-red-700 dark:text-red-100"
                title="Remove image"
                disabled={loading}
              >
                <FaTimesCircle />
              </button>
            </div>
          ))}
          {images.map((file, index) => (
            <div key={`new-${index}`} className="relative w-full aspect-square border rounded-md overflow-hidden shadow-sm group dark:border-gray-700">
              <Image
                src={URL.createObjectURL(file)}
                alt={`Product new image ${index + 1}`}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  dark:bg-red-700 dark:text-red-100"
                title="Remove image"
                disabled={loading}
              >
                <FaTimesCircle />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-8">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background
            px-5 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
            disabled:pointer-events-none disabled:opacity-50
            dark:border-input dark:bg-background dark:hover:bg-accent dark:hover:text-accent-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary text-primary-foreground
            px-5 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-primary/90
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
            disabled:pointer-events-none disabled:opacity-50
            dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90
            flex items-center justify-center gap-2"
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-current"
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
            <span>{isAddMode ? "Create Product" : "Save Changes"}</span>
          )}
        </button>
      </div>
    </form>
  );
}