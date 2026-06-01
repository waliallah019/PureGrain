"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { IRawLeather, IRawLeatherType } from "@/types/rawLeather"; // Import IRawLeatherType
import { FaEdit, FaTrash, FaPlusCircle, FaTags } from "react-icons/fa"; // Added FaTags for new button
import RawLeatherForm from "@/components/RawLeatherForm";
import Modal from "@/components/Modal";
import { toast } from "react-hot-toast";
import RawLeatherTypeManager from "./RawLeatherTypeManager"; // Corrected import path (assuming same directory)

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

// New imports for search, sort, and pagination
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter } from "lucide-react";

interface RawLeatherListProps {
  initialRawLeatherData: IRawLeather[];
  initialTotalRawLeatherCount: number;
  initialRawLeatherTypes: IRawLeatherType[]; // NEW PROP
}

type SortKey =
  | "name"
  | "leatherType"
  | "animal"
  | "finish"
  | "thickness"
  | "size"
  | "minOrderQuantity"
  | "sampleAvailable"
  | "isFeatured"
  | "isArchived"
  | "pricePerSqFt"
  | "currency"
  | "priceUnit"
  | "discountAvailable"
  | "negotiable"
  | "createdAt"
  | "updatedAt";

type SortOrder = "asc" | "desc";

export default function RawLeatherList({
  initialRawLeatherData,
  initialTotalRawLeatherCount,
  initialRawLeatherTypes, // NEW PROP USAGE
}: RawLeatherListProps) {
  const [rawLeather, setRawLeather] = useState<IRawLeather[]>(initialRawLeatherData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRawLeather, setCurrentRawLeather] = useState<IRawLeather | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRawLeatherCount, setTotalRawLeatherCount] = useState(initialTotalRawLeatherCount);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortColumn, setSortColumn] = useState<SortKey | null>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Leather Hides Types State
  const [rawLeatherTypes, setRawLeatherTypes] = useState<IRawLeatherType[]>(initialRawLeatherTypes); // State for dynamic leather hides types
  const [isRawLeatherTypeManagerOpen, setIsRawLeatherTypeManagerOpen] = useState(false); // State for leather hides type manager modal


  // Actual applied filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLeatherType, setFilterLeatherType] = useState<string>("");
  const [filterAnimal, setFilterAnimal] = useState<string>("");
  const [filterFinish, setFilterFinish] = useState<string>("");
  const [filterColor, setFilterColor] = useState<string>("");
  const [filterIsFeatured, setFilterIsFeatured] = useState<string>("");
  const [filterIsArchived, setFilterIsArchived] = useState<string>("");
  const [filterPriceUnit, setFilterPriceUnit] = useState<string>("");
  const [filterDiscountAvailable, setFilterDiscountAvailable] = useState<string>("");
  const [filterNegotiable, setFilterNegotiable] = useState<string>("");

  // Temporary filter states for Popover inputs
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [tempFilterLeatherType, setTempFilterLeatherType] = useState("");
  const [tempFilterAnimal, setTempFilterAnimal] = useState("");
  const [tempFilterFinish, setTempFilterFinish] = useState("");
  const [tempFilterColor, setTempFilterColor] = useState("");
  const [tempFilterIsFeatured, setTempFilterIsFeatured] = useState("");
  const [tempFilterIsArchived, setTempFilterIsArchived] = useState("");
  const [tempFilterPriceUnit, setTempFilterPriceUnit] = useState("");
  const [tempFilterDiscountAvailable, setTempFilterDiscountAvailable] = useState("");
  const [tempFilterNegotiable, setTempFilterNegotiable] = useState("");


  // Removed hardcoded leatherTypes here, using the state `rawLeatherTypes`
  const animals = ["Cow", "Buffalo", "Goat", "Sheep", "Exotic"];
  const finishes = [
    "Aniline", "Semi-Aniline", "Pigmented", "Pull-up", "Crazy Horse", "Waxed", "Nappa", "Embossed"
  ];
  const priceUnits = ["per sq.ft.", "per kg"];


  const formatColumn = (col: string) =>
    col.replace(/([a-z])([A-Z])/g, "$1 $2");

  const fetchRawLeatherTypes = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/raw-leather-types`);
      if (!response.ok) {
        throw new Error("Failed to fetch leather hides types.");
      }
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        setRawLeatherTypes(data.data);
      } else {
        console.error("Backend response 'data' field for leather hides types is not an array:", data);
        setRawLeatherTypes([]);
      }
    } catch (err: any) {
      console.error("Error fetching leather hides types (frontend):", err);
      toast.error(`Error fetching leather hides types: ${err.message}`);
      setRawLeatherTypes([]);
    }
  }, []);

  const fetchRawLeather = useCallback(async () => {
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
      if (filterLeatherType) {
        queryParams.append("leatherType", filterLeatherType);
      }
      if (filterAnimal) {
        queryParams.append("animal", filterAnimal);
      }
      if (filterFinish) {
        queryParams.append("finish", filterFinish);
      }
      if (filterColor) {
        queryParams.append("color", filterColor);
      }
      if (filterIsFeatured !== "") {
        queryParams.append("isFeatured", filterIsFeatured);
      }
      if (filterIsArchived !== "") {
        queryParams.append("isArchived", filterIsArchived);
      }
      if (filterPriceUnit) {
        queryParams.append("priceUnit", filterPriceUnit);
      }
      if (filterDiscountAvailable !== "") {
        queryParams.append("discountAvailable", filterDiscountAvailable);
      }
      if (filterNegotiable !== "") {
        queryParams.append("negotiable", filterNegotiable);
      }


      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/raw-leather?${queryParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch leather hides.");
      }

      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        setRawLeather(data.data);
      } else {
        console.error("Backend response 'data' field is not an array:", data);
        setRawLeather([]);
      }

      if (data.pagination && typeof data.pagination.totalProducts === 'number') {
        setTotalRawLeatherCount(data.pagination.totalProducts);
      } else {
        console.warn("Backend response 'pagination.totalProducts' is missing or not a number:", data);
        setTotalRawLeatherCount(0);
      }

    } catch (err: any) {
      console.error("Error fetching leather hides:", err);
      setError(err.message || "An unexpected error occurred.");
      toast.error(`Error fetching leather hides: ${err.message}`);
      setRawLeather([]);
      setTotalRawLeatherCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    sortColumn,
    sortOrder,
    searchTerm,
    filterLeatherType,
    filterAnimal,
    filterFinish,
    filterColor,
    filterIsFeatured,
    filterIsArchived,
    filterPriceUnit,
    filterDiscountAvailable,
    filterNegotiable,
  ]);

  useEffect(() => {
    fetchRawLeather();
    fetchRawLeatherTypes(); // Fetch leather hides types on initial load
  }, [
    fetchRawLeather,
    fetchRawLeatherTypes,
  ]);


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleSort = (column: SortKey) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleTempFilterChange = (filterName: string, value: string) => {
    const effectiveValue = value === "all" ? "" : value;

    switch (filterName) {
      case "search":
        setTempSearchTerm(value);
        break;
      case "leatherType":
        setTempFilterLeatherType(effectiveValue);
        break;
      case "animal":
        setTempFilterAnimal(effectiveValue);
        break;
      case "finish":
        setTempFilterFinish(effectiveValue);
        break;
      case "color":
        setTempFilterColor(value);
        break;
      case "isFeatured":
        setTempFilterIsFeatured(effectiveValue);
        break;
      case "isArchived":
        setTempFilterIsArchived(effectiveValue);
        break;
      case "priceUnit":
        setTempFilterPriceUnit(effectiveValue);
        break;
      case "discountAvailable":
        setTempFilterDiscountAvailable(effectiveValue);
        break;
      case "negotiable":
        setTempFilterNegotiable(effectiveValue);
        break;
      default:
        break;
    }
  };

  const handleApplyFilters = () => {
    setSearchTerm(tempSearchTerm);
    setFilterLeatherType(tempFilterLeatherType);
    setFilterAnimal(tempFilterAnimal);
    setFilterFinish(tempFilterFinish);
    setFilterColor(tempFilterColor);
    setFilterIsFeatured(tempFilterIsFeatured);
    setFilterIsArchived(tempFilterIsArchived);
    setFilterPriceUnit(tempFilterPriceUnit);
    setFilterDiscountAvailable(tempFilterDiscountAvailable);
    setFilterNegotiable(tempFilterNegotiable);
    setCurrentPage(1);
  };

  const onPopoverOpen = (open: boolean) => {
    if (open) {
      setTempSearchTerm(searchTerm);
      setTempFilterLeatherType(filterLeatherType);
      setTempFilterAnimal(filterAnimal);
      setTempFilterFinish(filterFinish);
      setTempFilterColor(filterColor);
      setTempFilterIsFeatured(filterIsFeatured);
      setTempFilterIsArchived(filterIsArchived);
      setTempFilterPriceUnit(filterPriceUnit);
      setTempFilterDiscountAvailable(filterDiscountAvailable);
      setTempFilterNegotiable(filterNegotiable);
    }
  };

  const handleClearFilters = () => {
    // Clear actual filter states
    setFilterLeatherType("");
    setFilterAnimal("");
    setFilterFinish("");
    setFilterColor("");
    setFilterIsFeatured("");
    setFilterIsArchived(""); // Explicitly clear isArchived to "all" (empty string)
    setFilterPriceUnit("");
    setFilterDiscountAvailable("");
    setFilterNegotiable("");
    setSearchTerm("");
    
    // Clear temporary filter states
    setTempSearchTerm("");
    setTempFilterLeatherType("");
    setTempFilterAnimal("");
    setTempFilterFinish("");
    setTempFilterColor("");
    setTempFilterIsFeatured("");
    setTempFilterIsArchived(""); // Explicitly clear temp isArchived to "all" (empty string)
    setTempFilterPriceUnit("");
    setTempFilterDiscountAvailable("");
    setTempFilterNegotiable("");

    setCurrentPage(1);
    setSortColumn("createdAt");
    setSortOrder("desc");
  };

  const handleDelete = async (rawLeatherId: string) => {
    if (!window.confirm("Are you sure you want to delete this leather hides entry?")) {
      return;
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/raw-leather/${rawLeatherId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete leather hides entry.");
      }
      toast.success("Leather hides entry deleted successfully!");
      fetchRawLeather();
    } catch (error: any) {
      console.error("Error deleting leather hides entry:", error);
      toast.error(`Error deleting leather hides entry: ${error.message}`);
    }
  };

  const handleEdit = (rl: IRawLeather) => {
    setCurrentRawLeather(rl);
    setIsAddMode(false);
    setIsModalOpen(true);
  };

  const handleAddRawLeather = () => {
    setCurrentRawLeather(null);
    setIsAddMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentRawLeather(null);
    setIsAddMode(false);
  };

  const handleRawLeatherSubmitSuccess = (submittedRawLeather: IRawLeather, mode: "create" | "update") => {
    handleModalClose();
    fetchRawLeather();
  };

  const handleRawLeatherTypeManagerOpen = () => {
    setIsRawLeatherTypeManagerOpen(true);
  };

  const handleRawLeatherTypeManagerClose = () => {
    setIsRawLeatherTypeManagerOpen(false);
    fetchRawLeatherTypes(); // Re-fetch types when manager closes to update dropdowns
  };

  const totalPages = Math.ceil(totalRawLeatherCount / itemsPerPage);

  const renderSortIcon = (column: SortKey) => {
    if (sortColumn === column) {
      return sortOrder === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-2 h-4 w-4" />
      );
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground opacity-50" />;
  };

  const isDefaultSort = sortColumn === "createdAt" && sortOrder === "desc";
  const hasActiveFiltersOrNonDefaultSort =
    (searchTerm !== "" ||
    filterLeatherType !== "" ||
    filterAnimal !== "" ||
    filterFinish !== "" ||
    filterColor !== "" ||
    filterIsFeatured !== "" ||
    filterIsArchived !== "" ||
    filterPriceUnit !== "" ||
    filterDiscountAvailable !== "" ||
    filterNegotiable !== "") ||
    !isDefaultSort;


  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        
        <div className="flex-1 w-full flex items-center gap-2">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leather hides..."
              value={tempSearchTerm}
              onChange={(e) => handleTempFilterChange("search", e.target.value)}
              className="pl-9 pr-4 w-full"
            />
          </div>

          <Popover onOpenChange={onPopoverOpen}> {/* Use onOpenChange for popover state */}
            <PopoverTrigger asChild>
              <Button variant="outline" className="shrink-0">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFiltersOrNonDefaultSort && (
                  <span className="ml-2 w-2 h-2 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>
            {/* Popover content styling for mobile and desktop */}
            <PopoverContent className="w-[95vw] sm:w-[500px] p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-sm font-medium">Filter Leather Hides</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2"> {/* Changed to sm:grid-cols-2 lg:grid-cols-3 */}
                <div className="space-y-1">
                  <label htmlFor="filterLeatherType" className="text-xs text-muted-foreground">Leather Type</label>
                  <Select value={tempFilterLeatherType} onValueChange={(val) => handleTempFilterChange("leatherType", val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {rawLeatherTypes.map((type) => (
                        <SelectItem key={type._id} value={type.name}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="filterAnimal" className="text-xs text-muted-foreground">Animal</label>
                  <Select value={tempFilterAnimal} onValueChange={(val) => handleTempFilterChange("animal", val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Animals" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Animals</SelectItem>
                      {animals.map((animal) => (
                        <SelectItem key={animal} value={animal}>{animal}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="filterFinish" className="text-xs text-muted-foreground">Finish</label>
                  <Select value={tempFilterFinish} onValueChange={(val) => handleTempFilterChange("finish", val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Finishes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Finishes</SelectItem>
                      {finishes.map((finish) => (
                        <SelectItem key={finish} value={finish}>{finish}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="filterColor" className="text-xs text-muted-foreground">Color</label>
                  <Input
                    id="filterColor"
                    placeholder="By color"
                    value={tempFilterColor}
                    onChange={(e) => handleTempFilterChange("color", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="filterPriceUnit" className="text-xs text-muted-foreground">Price Unit</label>
                  <Select value={tempFilterPriceUnit} onValueChange={(val) => handleTempFilterChange("priceUnit", val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Units" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Units</SelectItem>
                      {priceUnits.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="filterIsFeatured" className="text-xs text-muted-foreground">Featured</label>
                  <Select value={tempFilterIsFeatured} onValueChange={(val) => handleTempFilterChange("isFeatured", val)}>
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
                <div className="space-y-1">
                  <label htmlFor="filterIsArchived" className="text-xs text-muted-foreground">Archived</label>
                  <Select value={tempFilterIsArchived} onValueChange={(val) => handleTempFilterChange("isArchived", val)}>
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
                <div className="space-y-1">
                  <label htmlFor="filterDiscountAvailable" className="text-xs text-muted-foreground">Discount</label>
                  <Select value={tempFilterDiscountAvailable} onValueChange={(val) => handleTempFilterChange("discountAvailable", val)}>
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
                <div className="space-y-1">
                  <label htmlFor="filterNegotiable" className="text-xs text-muted-foreground">Negotiable</label>
                  <Select value={tempFilterNegotiable} onValueChange={(val) => handleTempFilterChange("negotiable", val)}>
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
              </div> {/* End of two-column grid */}
              <Button onClick={handleApplyFilters} className="w-full mt-4">
                Apply Filters
              </Button>
              {hasActiveFiltersOrNonDefaultSort && (
                <Button variant="ghost" onClick={handleClearFilters} className="w-full">
                  Clear Filters
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row justify-end gap-2"> {/* Added flex-col sm:flex-row gap-2 */}
          <Button onClick={handleRawLeatherTypeManagerOpen} className="whitespace-nowrap"> {/* New button for managing types */}
            <FaTags className="mr-2 h-4 w-4" /> Manage Leather Types
          </Button>
          <Button onClick={handleAddRawLeather} className="whitespace-nowrap">
            <FaPlusCircle className="mr-2 h-4 w-4" /> Add New Leather Hides
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          Displaying {rawLeather.length} of {totalRawLeatherCount} entries
          {sortColumn && (
            <span className="ml-2 text-sm tracking-wide animate-fade-in">
              • sorted by: <span className="text-foreground font-medium">{formatColumn(sortColumn)}</span>
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

      {/* OPTIONAL: Add a relative div for scroll indicator if desired */}
      <div className="relative">
        <div className="rounded-md border overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="min-w-[900px]"> {/* Inner div for minimum width to force scroll */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-sm">Image</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("name")} className="px-2 h-auto justify-start text-sm">
                      Name
                      {renderSortIcon("name")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("leatherType")} className="px-2 h-auto justify-start text-sm">
                      Type
                      {renderSortIcon("leatherType")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("animal")} className="px-2 h-auto justify-start text-sm">
                      Animal
                      {renderSortIcon("animal")}
                    </Button>
                  </TableHead>
                  {/* REMOVED Thickness TableHead */}
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("pricePerSqFt")} className="px-2 h-auto justify-start text-sm">
                      Price
                      {renderSortIcon("pricePerSqFt")}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px] min-w-[80px] text-center">
                    <Button variant="ghost" onClick={() => handleSort("isFeatured")} className="px-2 h-auto justify-center text-sm">
                      Featured
                      {renderSortIcon("isFeatured")}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px] min-w-[80px] text-center">
                    <Button variant="ghost" onClick={() => handleSort("isArchived")} className="px-2 h-auto justify-center text-sm">
                      Archived
                      {renderSortIcon("isArchived")}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px] min-w-[100px] text-center">
                    <Button variant="ghost" className="px-2 h-auto justify-center text-sm">
                      Actions
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Loading leather hides entries...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : rawLeather.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No leather hides entries found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  rawLeather.map((rl) => (
                    <TableRow key={rl._id}>
                      <TableCell>
                        {rl.images && rl.images.length > 0 ? (
                          <Image
                            src={rl.images[0]}
                            alt={rl.name}
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
                      <TableCell className="font-medium">{rl.name}</TableCell>
                      <TableCell>{rl.leatherType}</TableCell>
                      <TableCell>{rl.animal}</TableCell>
                      {/* REMOVED Thickness TableCell */}
                      <TableCell>
                        {rl.currency} {rl.pricePerSqFt?.toFixed(2)}{" "}
                        <span className="text-muted-foreground text-xs">
                          {rl.priceUnit}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {rl.isFeatured ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {rl.isArchived ? (
                          <Badge variant="destructive">
                            Archived
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                            Live
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(rl)}
                            title="Edit Leather Hides"
                          >
                            <FaEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(rl._id)}
                            title="Delete Leather Hides"
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
        </div>
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
                className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              (totalPages <= 7 || (page >= currentPage - 2 && page <= currentPage + 2) || page === 1 || page === totalPages) ? (
                <PaginationItem key={page} className="hidden sm:inline-flex">
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ) : (page === currentPage - 3 || page === currentPage + 3) ? (
                 <PaginationItem key={page} className="hidden sm:inline-flex">
                   <span className="px-4 py-2 text-sm text-muted-foreground">...</span>
                 </PaginationItem>
              ) : null
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                className={
                  currentPage === totalPages || totalPages === 0
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div >

      <Modal isOpen={isModalOpen} onClose={handleModalClose}>
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="text-lg font-semibold leading-none tracking-tight">
            {isAddMode ? "Add New Leather Hides" : "Edit Leather Hides"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAddMode ? "Create a new leather hides entry for your catalog." : "Update leather hides details."}
          </p>
        </div>

        <div className="py-4">
          <RawLeatherForm
            rawLeather={currentRawLeather}
            isAddMode={isAddMode}
            onSuccess={handleRawLeatherSubmitSuccess}
            onClose={handleModalClose}
            availableLeatherTypes={rawLeatherTypes}
          />
        </div>
      </Modal>

      {/* Leather Hides Type Manager Modal */}
      <Modal
        isOpen={isRawLeatherTypeManagerOpen}
        onClose={handleRawLeatherTypeManagerClose}
      >
        <RawLeatherTypeManager
          onClose={handleRawLeatherTypeManagerClose}
          onUpdate={fetchRawLeatherTypes} // Refresh types when manager closes to update dropdowns
        />
      </Modal>
    </div >
  );
}