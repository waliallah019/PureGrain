"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { IProductType } from "@/types/product";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FaEdit, FaTrash, FaPlusCircle } from "react-icons/fa";
import { Loader2 } from "lucide-react";

interface ProductTypeManagerProps {
  onClose: () => void;
  onUpdate: () => void; // Callback to re-fetch product types in parent
}

export default function ProductTypeManager({
  onClose,
  onUpdate,
}: ProductTypeManagerProps) {
  const [productTypes, setProductTypes] = useState<IProductType[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [editingType, setEditingType] = useState<IProductType | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const fetchProductTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/product-types`);
      if (!response.ok) {
        throw new Error("Failed to fetch product types.");
      }
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        setProductTypes(data.data);
      } else {
        setProductTypes([]);
      }
    } catch (error: any) {
      toast.error(`Error fetching product types: ${error.message}`);
      console.error("Error fetching product types:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

  const handleAddOrUpdateType = async () => {
    if (!newTypeName.trim()) {
      toast.error("Product type name cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    try {
      let response;
      if (editingType) {
        // Update existing
        response = await fetch(`${API_URL}/product-types/${editingType._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newTypeName.trim() }),
        });
      } else {
        // Add new
        response = await fetch(`${API_URL}/product-types`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newTypeName.trim() }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Operation failed.");
      }

      toast.success(
        editingType
          ? "Product type updated successfully!"
          : "Product type added successfully!",
      );
      setNewTypeName("");
      setEditingType(null);
      await fetchProductTypes(); // Refresh the list
      onUpdate(); // Notify parent to update
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      console.error("Error adding/updating product type:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (type: IProductType) => {
    setNewTypeName(type.name);
    setEditingType(type);
  };

  const handleDeleteType = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product type?")) {
      return;
    }
    setLoading(true); // Indicate loading for deletion
    try {
      const response = await fetch(`${API_URL}/product-types/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete product type.");
      }
      toast.success("Product type deleted successfully!");
      await fetchProductTypes(); // Refresh the list
      onUpdate(); // Notify parent to update
    } catch (error: any) {
      toast.error(`Error deleting product type: ${error.message}`);
      console.error("Error deleting product type:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Title and Description for Product Type Manager */}
      <div className="flex flex-col space-y-1.5 text-center sm:text-left">
        <h2 className="text-lg font-semibold leading-none tracking-tight">
          Manage Product Types
        </h2>
        <p className="text-sm text-muted-foreground">
          Add, edit, or delete product types used in your inventory.
        </p>
      </div>

      <div className="flex space-x-2">
        <Input
          placeholder={
            editingType ? "Edit product type name" : "New product type name"
          }
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          disabled={isSubmitting}
        />
        <Button onClick={handleAddOrUpdateType} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editingType ? "Update" : "Add"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Type Name</TableHead>
              <TableHead className="w-[100px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin inline-block" />{" "}
                  Loading types...
                </TableCell>
              </TableRow>
            ) : productTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  No product types found.
                </TableCell>
              </TableRow>
            ) : (
              productTypes.map((type) => (
                <TableRow key={type._id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(type)}
                        title="Edit Type"
                        disabled={isSubmitting}
                      >
                        <FaEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteType(type._id)}
                        title="Delete Type"
                        disabled={isSubmitting}
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

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Close
        </Button>
      </div>
    </div>
  );
}