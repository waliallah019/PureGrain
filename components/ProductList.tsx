"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { IProduct, IProductType } from "@/types/product"; // Ensure IProduct and IProductType are updated!
import { FaEdit, FaTrash, FaPlusCircle, FaTags } from "react-icons/fa"; // Added FaTags for new button
import ProductForm from "@/components/ProductForm";
import Modal from "@/components/Modal";
import ProductTypeManager from "./ProductTypeManager"; // Corrected import path (assuming same directory)

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

// Search and sorting imports
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // For filters
import { Filter } from "lucide-react";

interface ProductListProps {
  initialProducts: IProduct[];
  totalProductsCount: number;
  initialProductTypes: IProductType[]; // NEW PROP
}

// Make sure these match your IProduct interface exactly and are sortable in the backend
type SortKey =
  | "name"
  | "productType"
  | "materialUsed"
  | "moq"
  | "isFeatured"
  | "pricePerUnit"
  | "category"
  | "availability"
  | "stockCount"
  | "createdAt"
  | "updatedAt"
  | "isArchived"
  | "sampleAvailable";
type SortOrder = "asc" | "desc";

export default function ProductList({
  initialProducts,
  totalProductsCount: initialTotalProductsCount,
  initialProductTypes, // NEW PROP USAGE
}: ProductListProps) {
  const [products, setProducts] = useState<IProduct[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<IProduct | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product Types State
  const [productTypes, setProductTypes] =
    useState<IProductType[]>(initialProductTypes); // State for dynamic product types
  const [isProductTypeManagerOpen, setIsProductTypeManagerOpen] =
    useState(false); // State for product type manager modal

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalProductsCount, setTotalProductsCount] = useState(
    initialTotalProductsCount,
  );

  // Sorting State
  const [sortColumn, setSortColumn] = useState<SortKey | null>("createdAt"); // Default sort by createdAt
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc"); // Default sort descending

  // Search and Filter States (Actual applied filters) - These trigger data fetch
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProductType, setFilterProductType] = useState<string>("");
  const [filterMaterial, setFilterMaterial] = useState<string>("");
  const [filterColor, setFilterColor] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterAvailability, setFilterAvailability] = useState<string>("");
  // filterIsArchived: "false" for active, "true" for archived, "" for all (both active and archived)
  const [filterIsArchived, setFilterIsArchived] = useState<string>("false");
  const [filterSampleAvailable, setFilterSampleAvailable] =
    useState<string>("");

  // Temporary filter states (for input fields in the popover) - Do NOT trigger fetch directly
  const [tempSearchTerm, setTempSearchTerm] = useState(searchTerm);
  const [tempFilterProductType, setTempFilterProductType] =
    useState(filterProductType);
  const [tempFilterMaterial, setTempFilterMaterial] =
    useState(filterMaterial);
  const [tempFilterColor, setTempFilterColor] = useState(filterColor);
  const [tempFilterCategory, setTempFilterCategory] =
    useState(filterCategory);
  const [tempFilterAvailability, setTempFilterAvailability] =
    useState(filterAvailability);
  const [tempFilterIsArchived, setTempFilterIsArchived] =
    useState(filterIsArchived);
  const [tempFilterSampleAvailable, setTempFilterSampleAvailable] =
    useState(filterSampleAvailable);

  const availabilityOptions = ["In Stock", "Made to Order", "Limited Stock"];

  const formatColumn = (col: string) =>
    col.replace(/([a-z])([A-Z])/g, "$1 $2"); // Converts 'MaterialUsed' → 'Material Used'

  const fetchProductTypes = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/product-types`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch product types.");
      }
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        setProductTypes(data.data);
      } else {
        console.error(
          "Backend response 'data' field for product types is not an array:",
          data,
        );
        setProductTypes([]);
      }
    } catch (err: any) {
      console.error("Error fetching product types (frontend):", err);
      toast.error(`Error fetching product types: ${err.message}`);
      setProductTypes([]);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", itemsPerPage.toString());

      if (sortColumn) {
        queryParams.append("sortBy", sortColumn);
        queryParams.append("order", sortOrder);
      }

      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }
      if (filterProductType) {
        queryParams.append("productType", filterProductType);
      }
      if (filterMaterial) {
        queryParams.append("material", filterMaterial);
      }
      if (filterColor) {
        queryParams.append("color", filterColor);
      }
      if (filterCategory) {
        queryParams.append("category", filterCategory);
      }
      if (filterAvailability) {
        queryParams.append("availability", filterAvailability);
      }
      if (filterIsArchived !== "") {
        queryParams.append("isArchived", filterIsArchived);
      }

      if (filterSampleAvailable !== "") {
        queryParams.append("sampleAvailable", filterSampleAvailable);
      }

      console.log("Fetching with params (frontend):", queryParams.toString());

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/finished-products?${queryParams.toString()}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch products.");
      }

      const data = await response.json();
      console.log("API Response (frontend):", data);

      if (data.data && Array.isArray(data.data)) {
        setProducts(data.data);
      } else {
        console.error("Backend response 'data' field is not an array:", data);
        setProducts([]);
      }

      if (
        data.pagination &&
        typeof data.pagination.totalProducts === "number"
      ) {
        setTotalProductsCount(data.pagination.totalProducts);
      } else {
        console.warn(
          "Backend response 'pagination.totalProducts' is missing or not a number:",
          data,
        );
        setTotalProductsCount(0);
      }
    } catch (err: any) {
      console.error("Error fetching products (frontend):", err);
      toast.error(`Error fetching products: ${err.message}`);
      setError(err.message || "An unexpected error occurred.");
      setProducts([]);
      setTotalProductsCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    sortColumn,
    sortOrder,
    searchTerm,
    filterProductType,
    filterMaterial,
    filterColor,
    filterCategory,
    filterAvailability,
    filterIsArchived,
    filterSampleAvailable,
  ]);

  useEffect(() => {
    fetchProducts();
    fetchProductTypes(); // Fetch product types on initial load
  }, [fetchProducts, fetchProductTypes]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleSort = (column: SortKey) => {
    if (sortColumn === column) {
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(newOrder);
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // --- Handle changes in temporary filter states ---
  const handleTempFilterChange = (filterName: string, value: string) => {
    switch (filterName) {
      case "search":
        setTempSearchTerm(value);
        break;
      case "productType":
        setTempFilterProductType(value === "all" ? "" : value);
        break;
      case "material":
        setTempFilterMaterial(value);
        break;
      case "color":
        setTempFilterColor(value);
        break;
      case "category":
        setTempFilterCategory(value === "all" ? "" : value);
        break;
      case "availability":
        setTempFilterAvailability(value === "all" ? "" : value);
        break;
      case "isArchived":
        setTempFilterIsArchived(value); // Keep "all", "true", "false" as is for temp state
        break;
      case "sampleAvailable":
        setTempFilterSampleAvailable(value === "all" ? "" : value);
        break;
      default:
        break;
    }
  };

  // --- Apply temporary filters to actual filters ---
  const handleApplyFilters = () => {
    setSearchTerm(tempSearchTerm);
    setFilterProductType(tempFilterProductType);
    setFilterMaterial(tempFilterMaterial);
    setFilterColor(tempFilterColor);
    setFilterCategory(tempFilterCategory);
    setFilterAvailability(tempFilterAvailability);
    setFilterIsArchived(tempFilterIsArchived);
    setFilterSampleAvailable(tempFilterSampleAvailable);
    setCurrentPage(1);
  };

  // --- Reset temporary filters when popover is opened ---
  const onPopoverOpen = () => {
    setTempSearchTerm(searchTerm);
    setTempFilterProductType(filterProductType);
    setTempFilterMaterial(filterMaterial);
    setTempFilterColor(filterColor);
    setTempFilterCategory(filterCategory);
    setTempFilterAvailability(filterAvailability);
    setTempFilterIsArchived(filterIsArchived === "" ? "all" : filterIsArchived);
    setTempFilterSampleAvailable(filterSampleAvailable);
  };

  const handleClearFilters = () => {
    setFilterProductType("");
    setFilterMaterial("");
    setFilterColor("");
    setFilterCategory("");
    setFilterAvailability("");
    setFilterIsArchived("false"); // Reset to default: show active products (by param)
    setFilterSampleAvailable("");
    setSearchTerm("");

    setTempSearchTerm("");
    setTempFilterProductType("");
    setTempFilterMaterial("");
    setTempFilterColor("");
    setTempFilterCategory("");
    setTempFilterAvailability("");
    setTempFilterIsArchived("false");
    setTempFilterSampleAvailable("");

    setCurrentPage(1);
    setSortColumn("createdAt");
    setSortOrder("desc");
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/finished-products/${productId}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete product.");
      }
      toast.success("Product deleted successfully!");
      fetchProducts();
    } catch (error: any) {
      console.error("Error deleting product (frontend):", error);
      toast.error(`Error deleting product: ${error.message}`);
    }
  };

  const handleEdit = (product: IProduct) => {
    setCurrentProduct(product);
    setIsAddMode(false);
    setIsModalOpen(true);
  };

  const handleAddProduct = () => {
    setCurrentProduct(null);
    setIsAddMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
    setIsAddMode(false);
  };

  const handleProductSubmitSuccess = () => {
    handleModalClose();
    fetchProducts(); // Re-fetch products after successful create/update
  };

  const handleProductTypeManagerOpen = () => {
    setIsProductTypeManagerOpen(true);
  };

  const handleProductTypeManagerClose = () => {
    setIsProductTypeManagerOpen(false);
    fetchProductTypes(); // Re-fetch product types when manager closes to update dropdowns
  };

  const totalPages = Math.ceil(totalProductsCount / itemsPerPage);

  const renderSortIcon = (column: SortKey) => {
    if (sortColumn === column) {
      return sortOrder === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-2 h-4 w-4" />
      );
    }
    return (
      <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground opacity-50" />
    );
  };

  // Determine if any filters are active (including non-default sort) for the badge and clear button
  const isDefaultSort = sortColumn === "createdAt" && sortOrder === "desc";
  const hasActiveFiltersOrNonDefaultSort =
    searchTerm !== "" ||
    filterProductType !== "" ||
    filterMaterial !== "" ||
    filterColor !== "" ||
    filterCategory !== "" ||
    filterAvailability !== "" ||
    (filterIsArchived !== "" && filterIsArchived !== "false") ||
    filterSampleAvailable !== "" ||
    !isDefaultSort;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex-1 w-full flex items-center gap-2">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={tempSearchTerm}
              onChange={(e) =>
                handleTempFilterChange("search", e.target.value)
              }
              className="pl-9 pr-4 w-full"
            />
          </div>

          <Popover onOpenChange={onPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="shrink-0">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFiltersOrNonDefaultSort && (
                  <span className="ml-2 w-2 h-2 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <p className="text-sm font-medium">Filter Products</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                <div className="space-y-1">
                  <label
                    htmlFor="filterProductType"
                    className="text-xs text-muted-foreground"
                  >
                    Product Type
                  </label>
                  <Select
                    value={tempFilterProductType}
                    onValueChange={(val) =>
                      handleTempFilterChange("productType", val)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {productTypes.map((type) => (
                        <SelectItem key={type._id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Removed the inline "Manage Types" button from here */}
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="filterMaterial"
                    className="text-xs text-muted-foreground"
                  >
                    Material
                  </label>
                  <Input
                    id="filterMaterial"
                    placeholder="By material"
                    value={tempFilterMaterial}
                    onChange={(e) =>
                      handleTempFilterChange("material", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="filterColor"
                    className="text-xs text-muted-foreground"
                  >
                    Color
                  </label>
                  <Input
                    id="filterColor"
                    placeholder="By color"
                    value={tempFilterColor}
                    onChange={(e) =>
                      handleTempFilterChange("color", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="filterCategory"
                    className="text-xs text-muted-foreground"
                  >
                    Category
                  </label>
                  <Input
                    id="filterCategory"
                    placeholder="By category"
                    value={tempFilterCategory}
                    onChange={(e) =>
                      handleTempFilterChange("category", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="filterAvailability"
                    className="text-xs text-muted-foreground"
                  >
                    Availability
                  </label>
                  <Select
                    value={tempFilterAvailability}
                    onValueChange={(val) =>
                      handleTempFilterChange("availability", val)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {availabilityOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="filterIsArchived"
                    className="text-xs text-muted-foreground"
                  >
                    Product Status
                  </label>
                  <Select
                    value={tempFilterIsArchived}
                    onValueChange={(val) =>
                      handleTempFilterChange("isArchived", val)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Active" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Active</SelectItem>
                      <SelectItem value="true">Archived</SelectItem>
                      <SelectItem value="all">All (Active & Archived)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="filterSampleAvailable"
                    className="text-xs text-muted-foreground"
                  >
                    Sample Available
                  </label>
                  <Select
                    value={tempFilterSampleAvailable}
                    onValueChange={(val) =>
                      handleTempFilterChange("sampleAvailable", val)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleApplyFilters} className="w-full mt-4">
                Apply Filters
              </Button>
              {hasActiveFiltersOrNonDefaultSort && (
                <Button
                  variant="ghost"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* New buttons next to each other */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row justify-end gap-2">
          <Button onClick={handleProductTypeManagerOpen} className="whitespace-nowrap">
            <FaTags className="mr-2 h-4 w-4" /> Manage Product Types
          </Button>
          <Button onClick={handleAddProduct} className="whitespace-nowrap">
            <FaPlusCircle className="mr-2 h-4 w-4" /> Add New Product
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 flex-wrap gap-y-2">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          Displaying {products.length} of {totalProductsCount} products
          {/* Prominent Active/Archived Indicator */}
          {filterIsArchived === "true" ? (
            <Badge variant="destructive" className="ml-2 font-semibold">
              Archived Products
            </Badge>
          ) : filterIsArchived === "false" ? (
            <Badge
              variant="default"
              className="ml-2 bg-blue-600 hover:bg-blue-700 font-semibold"
            >
              Active Products
            </Badge>
          ) : (
            // When filterIsArchived is "" (meaning 'all' selected in filter)
            <Badge
              variant="outline"
              className="ml-2 bg-gray-500 text-white hover:bg-gray-600 font-semibold"
            >
              All Products
            </Badge>
          )}

          {sortColumn && (
            <span className="ml-2 text-sm tracking-wide animate-fade-in hidden sm:inline-block">
              • sorted by:{" "}
              <span className="text-foreground font-medium">
                {formatColumn(sortColumn)}
              </span>
              <span className="ml-1 text-gray-500 uppercase">{sortOrder}</span>
            </span>
          )}
        </p>

        {hasActiveFiltersOrNonDefaultSort && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handleClearFilters}
          >
            Clear All Filters & Sort
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="px-2 h-auto justify-start hover:bg-muted"
                >
                  Name
                  {renderSortIcon("name")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("productType")}
                  className="px-2 h-auto justify-start hover:bg-muted"
                >
                  Type
                  {renderSortIcon("productType")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("materialUsed")}
                  className="px-2 h-auto justify-start hover:bg-muted"
                >
                  Material
                  {renderSortIcon("materialUsed")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("pricePerUnit")}
                  className="px-2 h-auto justify-start hover:bg-muted"
                >
                  Price
                  {renderSortIcon("pricePerUnit")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("stockCount")}
                  className="px-2 h-auto justify-start hover:bg-muted"
                >
                  Stock
                  {renderSortIcon("stockCount")}
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("sampleAvailable")}
                  className="px-2 h-auto justify-center hover:bg-muted"
                >
                  Sample
                  {renderSortIcon("sampleAvailable")}
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("isFeatured")}
                  className="px-2 h-auto justify-center hover:bg-muted"
                >
                  Featured
                  {renderSortIcon("isFeatured")}
                </Button>
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={9} // Adjusted colspan
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading products...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={9} // Adjusted colspan
                  className="h-24 text-center text-destructive"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9} // Adjusted colspan
                  className="h-24 text-center text-muted-foreground"
                >
                  No finished products found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        width={60}
                        height={60}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.productType}</TableCell>
                  <TableCell>{product.materialUsed}</TableCell>
                  <TableCell>
                    {product.currency} {product.pricePerUnit?.toFixed(2)}{" "}
                    <span className="text-muted-foreground text-xs">
                      {product.priceUnit}
                    </span>
                  </TableCell>
                  <TableCell>{product.stockCount}</TableCell>
                  <TableCell className="text-center">
                    {product.sampleAvailable ? (
                      <Badge
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {product.isFeatured ? (
                      <Badge
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                        title="Edit Product"
                      >
                        <FaEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product._id)}
                        title="Delete Product"
                      >
                        <FaTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-4 flex-wrap gap-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Pagination className="justify-end w-auto mx-0">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) =>
              totalPages <= 7 ||
              (page >= currentPage - 2 && page <= currentPage + 2) ||
              page === 1 ||
              page === totalPages ? (
                <PaginationItem key={page} className="hidden sm:inline-flex">
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ) : page === currentPage - 3 || page === currentPage + 3 ? (
                <PaginationItem key={page} className="hidden sm:inline-flex">
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    ...
                  </span>
                </PaginationItem>
              ) : null,
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                className={
                  currentPage === totalPages || totalPages === 0
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleModalClose}>
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            {isAddMode ? "Add New Product" : "Edit Product"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAddMode
              ? "Create a new product for your catalog."
              : "Update product details."}
          </p>
        </div>

        <div className="py-4">
          <ProductForm
            product={currentProduct}
            isAddMode={isAddMode}
            onSuccess={handleProductSubmitSuccess}
            onClose={handleModalClose}
            availableProductTypes={productTypes} // Pass dynamic product types
          />
        </div>
      </Modal>

      {/* Product Type Manager Modal - NO title/description props, content handled by ProductTypeManager */}
      <Modal
        isOpen={isProductTypeManagerOpen}
        onClose={handleProductTypeManagerClose}
      >
        <ProductTypeManager
          onClose={handleProductTypeManagerClose}
          onUpdate={fetchProductTypes} // Refresh types when manager updates
        />
      </Modal>
    </div>
  );
}