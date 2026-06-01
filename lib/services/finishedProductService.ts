import FinishedProduct, { IFinishedProduct } from "../models/FinishedProduct";
import logger from "../config/logger";
import cloudinary from "../config/cloudinary";

interface FinishedProductFilters {
  productType?: string;
  color?: string; // This will search within colorVariants array
  material?: string;
  search?: string;
  category?: string; // New filter
  availability?: string; // New filter
  isActive?: boolean; // New filter (will be boolean due to Zod preprocess)
  isArchived?: boolean; // NEW FILTER (will be boolean due to Zod preprocess)
  sampleAvailable?: boolean; // NEW FILTER
  isFeatured?: boolean; // NEW FILTER for featured products
}

class FinishedProductService {
  /**
   * Creates a new finished product.
   * @param productData - The product data including Cloudinary image URLs.
   * @returns The created product.
   */
  public async createProduct(
    productData: Partial<IFinishedProduct>,
  ): Promise<IFinishedProduct> {
    try {
      const newProduct = new FinishedProduct(productData);
      await newProduct.save();
      logger.info(`Created new finished product: ${newProduct.name}`);
      return newProduct;
    } catch (error: any) {
      logger.error(`Error creating finished product: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves a list of finished products with optional filters, pagination, and sorting.
   * @param filters - Object containing productType, color, material, search string, category, availability, isActive, isArchived.
   * @param page - Page number for pagination.
   * @param limit - Number of items per page for pagination.
   * @param sortBy - The field to sort by (e.g., 'name', 'createdAt').
   * @param order - Sort order: 'asc' or 'desc'.
   * @returns An object containing products, total count, and pagination info.
   */
  public async getProducts(
    filters: FinishedProductFilters,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "createdAt", // Default to createdAt
    order: string = "desc", // Default to descending (newest first)
  ): Promise<{
    products: IFinishedProduct[];
    total: number;
    page: number;
    limit: number;
  }> {
    console.log("Backend: getProducts - Filters received:", filters);
    console.log(
      "Backend: getProducts - Page:",
      page,
      "Limit:",
      limit,
      "SortBy:",
      sortBy,
      "Order:",
      order,
    );

    const query: any = {};

    if (filters.productType) {
      // productType is now a string, so direct match is fine, or regex if you want partial search
      query.productType = filters.productType;
    }
    if (filters.color) {
      // Changed to $elemMatch with regex for more flexible color search
      query.colorVariants = { $elemMatch: { $regex: new RegExp(filters.color, "i") } };
    }
    if (filters.material) {
      query.materialUsed = { $regex: new RegExp(filters.material, "i") };
    }
    if (filters.category) {
      query.category = { $regex: new RegExp(filters.category, "i") };
    }
    if (filters.availability) {
      query.availability = filters.availability;
    }

    // Handle isActive filter (it will be a boolean from Zod validation or undefined)
    // Note: The UI for isActive filter was removed, but the backend logic remains capable of handling it.
    if (typeof filters.isActive === "boolean") {
      query.isActive = filters.isActive;
    }

    // Handle sampleAvailable filter
    if (typeof filters.sampleAvailable === "boolean") { // NEW FILTER
      query.sampleAvailable = filters.sampleAvailable;
    }

    // Handle isFeatured filter
    if (typeof filters.isFeatured === "boolean") {
      query.isFeatured = filters.isFeatured;
    }

    // --- DEBUGGING isArchived START ---
    console.log(
      `Backend: DEBUG: filters.isArchived type: ${typeof filters.isArchived}, value: ${filters.isArchived}`,
    );
    if (typeof filters.isArchived === "boolean") {
      console.log(
        `Backend: DEBUG: isArchived filter IS a boolean. Setting query.isArchived to: ${filters.isArchived}`,
      );
      query.isArchived = filters.isArchived;
    } else {
      console.log(
        "Backend: DEBUG: isArchived filter is NOT a boolean (or undefined). Applying default: { $ne: true }",
      );
      // Default behavior if isArchived filter is not explicitly set: Show non-archived products.
      // This means products where isArchived is false or undefined.
      query.isArchived = { $ne: true };
    }
    // --- DEBUGGING isArchived END ---

    if (filters.search) {
      query.$or = [
        { name: { $regex: new RegExp(filters.search, "i") } },
        { description: { $regex: new RegExp(filters.search, "i") } },
        { tags: { $elemMatch: { $regex: new RegExp(filters.search, "i") } } }, // Search in tags
      ];
    }

    try {
      const skip = (page - 1) * limit;
      console.log(
        "Backend: Mongoose Query object before count/find:",
        JSON.stringify(query),
      );
      const total = await FinishedProduct.countDocuments(query);
      console.log("Backend: Total products found by query:", total);

      // Define allowed sort fields to prevent unexpected behavior or security risks
      const allowedSortFields = [
        "name",
        "productType",
        "materialUsed",
        "moq",
        "pricePerUnit", // New sortable field
        "isFeatured",
        "sampleAvailable", // NEW SORTABLE FIELD
        "createdAt",
        "updatedAt", // Good to include if you track updates
        "category", // New sortable field
        "availability", // New sortable field
        "stockCount", // New sortable field
        "isActive", // New sortable field
        "isArchived", // New sortable field
      ];

      // Validate sortBy and determine sort order value
      let sortOptions: { [key: string]: 1 | -1 } = {};

      if (sortBy && allowedSortFields.includes(sortBy)) {
        sortOptions[sortBy] = order === "desc" ? -1 : 1;
      } else {
        // Fallback to default sort if sortBy is invalid or not provided
        sortOptions = { createdAt: -1 };
        logger.warn(
          `Invalid or unallowed sortBy field: ${sortBy}. Defaulting to createdAt descending.`,
        );
      }

      const products = await FinishedProduct.find(query)
        .sort(sortOptions) // Apply the dynamic sort options here
        .skip(skip)
        .limit(limit)
        .exec();

      logger.info(
        `Retrieved ${products.length} finished products (total: ${total})`,
      );
      console.log(
        "Backend: Products fetched from DB:",
        products.map((p) => ({
          _id: p._id,
          name: p.name,
          isActive: p.isActive,
          isArchived: p.isArchived,
          sampleAvailable: p.sampleAvailable, // Added for quick debugging
        })),
      );
      console.log("Backend: Number of products fetched:", products.length);
      return { products, total, page, limit };
    } catch (error: any) {
      logger.error(`Error getting finished products: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves a single finished product by its ID.
   * @param id - The ID of the product.
   * @returns The found product or null.
   */
  public async getProductById(id: string): Promise<IFinishedProduct | null> {
    try {
      const product = await FinishedProduct.findById(id);
      if (product) {
        logger.info(`Retrieved finished product by ID: ${id}`);
      } else {
        logger.warn(`Finished product not found by ID: ${id}`);
      }
      return product;
    } catch (error: any) {
      logger.error(
        `Error getting finished product by ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Updates an existing finished product.
   * @param id - The ID of the product to update.
   * @param updateData - The data to update, including potentially new image URLs.
   * @returns The updated product or null.
   */
  public async updateProduct(
    id: string,
    updateData: Partial<IFinishedProduct>,
  ): Promise<IFinishedProduct | null> {
    try {
      const product = await FinishedProduct.findById(id);
      if (!product) {
        return null;
      }

      // Apply updates (including image URLs directly if provided)
      Object.assign(product, updateData);
      await product.save();
      logger.info(`Updated finished product: ${product.name} (ID: ${id})`);
      return product;
    } catch (error: any) {
      logger.error(
        `Error updating finished product by ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Deletes a finished product by its ID.
   * Also deletes associated images from Cloudinary.
   * @param id - The ID of the product to delete.
   * @returns True if deleted, false if not found.
   */
  public async deleteProduct(id: string): Promise<boolean> {
    try {
      const product = await FinishedProduct.findById(id);
      if (!product) {
        logger.warn(`Attempted to delete non-existent product ID: ${id}`);
        return false;
      }

      // Delete images from Cloudinary
      for (const imageUrl of product.images) {
        try {
          // Extract public ID from Cloudinary URL, assuming a format like:
          // .../finished-products/PUBLIC_ID.extension
          const parts = imageUrl.split("/");
          const folderIndex = parts.indexOf("finished-products");
          if (folderIndex > -1 && parts.length > folderIndex + 1) {
            const publicIdWithExt = parts.slice(folderIndex + 1).join("/").split(".")[0];
            await cloudinary.uploader.destroy(`finished-products/${publicIdWithExt}`); // Reconstruct full public ID path for destroy
            logger.info(
              `Deleted Cloudinary image: finished-products/${publicIdWithExt}`,
            );
          } else {
            logger.warn(`Could not extract public ID from URL: ${imageUrl}`);
          }
        } catch (imgDeleteError: any) {
          logger.error(
            `Failed to delete Cloudinary image ${imageUrl}: ${imgDeleteError.message}`,
          );
        }
      }

      await product.deleteOne();
      logger.info(`Deleted finished product ID: ${id}`);
      return true;
    } catch (error: any) {
      logger.error(
        `Error deleting finished product by ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Removes specific images from a finished product.
   * @param id - The ID of the product.
   * @param imageUrlsToRemove - An array of URLs of images to remove.
   * @returns The updated product or null.
   */
  public async removeProductImages(
    id: string,
    imageUrlsToRemove: string[],
  ): Promise<IFinishedProduct | null> {
    try {
      const product = await FinishedProduct.findById(id);
      if (!product) {
        return null;
      }

      const imagesToDeletePublicIds: string[] = [];
      const updatedImages = product.images.filter((imgUrl) => {
        const shouldRemove = imageUrlsToRemove.includes(imgUrl);
        if (shouldRemove) {
          const parts = imgUrl.split("/");
          const folderIndex = parts.indexOf("finished-products");
          if (folderIndex > -1 && parts.length > folderIndex + 1) {
            const publicIdWithExt = parts.slice(folderIndex + 1).join("/").split(".")[0];
            imagesToDeletePublicIds.push(`finished-products/${publicIdWithExt}`);
          } else {
            logger.warn(
              `Could not extract public ID for removal from URL: ${imgUrl}`,
            );
          }
        }
        return !shouldRemove;
      });

      if (updatedImages.length === product.images.length) {
        logger.warn(`No matching images found to remove for product ID: ${id}`);
        return product;
      }

      for (const publicId of imagesToDeletePublicIds) {
        try {
          await cloudinary.uploader.destroy(publicId);
          logger.info(`Deleted Cloudinary image: ${publicId}`);
        } catch (imgDeleteError: any) {
          logger.error(
            `Failed to delete Cloudinary image ${publicId}: ${imgDeleteError.message}`,
          );
        }
      }

      product.images = updatedImages;
      await product.save();
      logger.info(`Removed images from product ID: ${id}`);
      return product;
    } catch (error: any) {
      logger.error(
        `Error removing images from product ID ${id}: ${error.message}`,
      );
      throw error;
    }
  }
}

export default new FinishedProductService();