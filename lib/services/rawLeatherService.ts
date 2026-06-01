import RawLeather, { IRawLeather } from "../models/RawLeather";
import logger from "../config/logger";
import cloudinary from "../config/cloudinary";

interface RawLeatherFilters {
  leatherType?: string; // This is now a dynamic string
  animal?: string;
  finish?: string;
  color?: string; // This will search within colors array
  search?: string;
  isFeatured?: boolean; // New filter
  isArchived?: boolean; // New filter
  priceUnit?: string; // New filter
  discountAvailable?: boolean; // New filter
  negotiable?: boolean; // New filter
}

class RawLeatherService {
  /**
   * Creates a new raw leather entry.
   * @param rawLeatherData - The raw leather data including Cloudinary image URLs.
   * @returns The created raw leather entry.
   */
  public async createRawLeather(
    rawLeatherData: Partial<IRawLeather>
  ): Promise<IRawLeather> {
    try {
      const newRawLeather = new RawLeather(rawLeatherData);
      await newRawLeather.save();
      logger.info(`Created new raw leather entry: ${newRawLeather.name}`);
      return newRawLeather;
    } catch (error: any) {
      logger.error(`Error creating raw leather entry: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves a list of raw leather entries with optional filters, pagination, and sorting.
   * @param filters - Object containing various filter criteria.
   * @param page - Page number for pagination.
   * @param limit - Number of items per page for pagination.
   * @param sortBy - The field to sort by (e.g., 'name', 'createdAt').
   * @param order - Sort order: 'asc' or 'desc'.
   * @returns An object containing raw leather entries, total count, and pagination info.
   */
  public async getRawLeather(
    filters: RawLeatherFilters,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "createdAt", // Default sort field
    order: string = "desc" // Default sort order
  ): Promise<{ rawLeather: IRawLeather[]; total: number; page: number; limit: number }> {
    const query: any = {};

    if (filters.leatherType) {
      query.leatherType = filters.leatherType; // Direct match on string
    }
    if (filters.animal) {
      query.animal = filters.animal;
    }
    if (filters.finish) {
      query.finish = filters.finish;
    }
    if (filters.color) {
      // Use $elemMatch with regex for flexible color search within array
      query.colors = { $elemMatch: { $regex: new RegExp(filters.color, "i") } };
    }

    // New filters
    if (typeof filters.isFeatured === "boolean") {
      query.isFeatured = filters.isFeatured;
    }
    if (typeof filters.isArchived === "boolean") {
      query.isArchived = filters.isArchived;
    } else {
      // Default behavior if isArchived filter is not explicitly set: Show non-archived products.
      query.isArchived = { $ne: true };
    }
    if (filters.priceUnit) {
      query.priceUnit = filters.priceUnit;
    }
    if (typeof filters.discountAvailable === "boolean") {
      query.discountAvailable = filters.discountAvailable;
    }
    if (typeof filters.negotiable === "boolean") {
      query.negotiable = filters.negotiable;
    }


    if (filters.search) {
      // Case-insensitive search on name, description, and tags (if tags were added to RawLeather model)
      // Assuming 'tags' field is not present in RawLeather model, only name and description for search
      query.$or = [
        { name: { $regex: new RegExp(filters.search, "i") } },
        { description: { $regex: new RegExp(filters.search, "i") } },
      ];
    }

    try {
      const skip = (page - 1) * limit;
      const total = await RawLeather.countDocuments(query);

      // Define allowed sort fields
      const allowedSortFields = [
        "name",
        "leatherType",
        "animal",
        "finish",
        "thickness",
        "size",
        "minOrderQuantity",
        "sampleAvailable",
        "isFeatured", // New sortable field
        "isArchived", // New sortable field
        "pricePerSqFt", // New sortable field
        "currency", // New sortable field
        "priceUnit", // New sortable field
        "discountAvailable", // New sortable field
        "negotiable", // New sortable field
        "createdAt",
        "updatedAt",
      ];

      let sortOptions: { [key: string]: 1 | -1 } = {};

      if (sortBy && allowedSortFields.includes(sortBy)) {
        sortOptions[sortBy] = order === "desc" ? -1 : 1;
      } else {
        sortOptions = { createdAt: -1 }; // Default sort
        logger.warn(`Invalid or unallowed sortBy field for RawLeather: ${sortBy}. Defaulting to createdAt descending.`);
      }

      const rawLeather = await RawLeather.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec();

      logger.info(
        `Retrieved ${rawLeather.length} raw leather entries (total: ${total})`
      );
      return { rawLeather, total, page, limit };
    } catch (error: any) {
      logger.error(`Error getting raw leather entries: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves a single raw leather entry by its ID.
   * @param id - The ID of the raw leather entry.
   * @returns The found raw leather entry or null.
   */
  public async getRawLeatherById(id: string): Promise<IRawLeather | null> {
    try {
      const rawLeather = await RawLeather.findById(id);
      if (rawLeather) {
        logger.info(`Retrieved raw leather entry by ID: ${id}`);
      } else {
        logger.warn(`Raw leather entry not found by ID: ${id}`);
      }
      return rawLeather;
    } catch (error: any) {
      logger.error(`Error getting raw leather entry by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates an existing raw leather entry.
   * @param id - The ID of the raw leather entry to update.
   * @param updateData - The data to update, including potentially new image URLs.
   * @returns The updated raw leather entry or null.
   */
  public async updateRawLeather(
    id: string,
    updateData: Partial<IRawLeather>
  ): Promise<IRawLeather | null> {
    try {
      const rawLeather = await RawLeather.findById(id);
      if (!rawLeather) {
        return null;
      }

      Object.assign(rawLeather, updateData);
      await rawLeather.save();
      logger.info(`Updated raw leather entry: ${rawLeather.name} (ID: ${id})`);
      return rawLeather;
    } catch (error: any) {
      logger.error(`Error updating raw leather entry by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a raw leather entry by its ID.
   * Also deletes associated images from Cloudinary.
   * @param id - The ID of the raw leather entry to delete.
   * @returns True if deleted, false if not found.
   */
  public async deleteRawLeather(id: string): Promise<boolean> {
    try {
      const rawLeather = await RawLeather.findById(id);
      if (!rawLeather) {
        logger.warn(`Attempted to delete non-existent raw leather ID: ${id}`);
        return false;
      }

      for (const imageUrl of rawLeather.images) {
        try {
          const parts = imageUrl.split('/');
          const folderIndex = parts.indexOf('raw-leather');
          if (folderIndex > -1 && parts.length > folderIndex + 1) {
            const publicIdWithExt = parts.slice(folderIndex + 1).join('/').split('.')[0];
            await cloudinary.uploader.destroy(`raw-leather/${publicIdWithExt}`);
            logger.info(`Deleted Cloudinary raw leather image: raw-leather/${publicIdWithExt}`);
          } else {
             logger.warn(`Could not extract public ID from URL for deletion: ${imageUrl}`);
          }
        } catch (imgDeleteError: any) {
          logger.error(`Failed to delete Cloudinary raw leather image ${imageUrl}: ${imgDeleteError.message}`);
        }
      }

      await rawLeather.deleteOne();
      logger.info(`Deleted raw leather entry ID: ${id}`);
      return true;
    } catch (error: any) {
      logger.error(`Error deleting raw leather entry by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Removes specific images from a raw leather entry.
   * @param id - The ID of the raw leather entry.
   * @param imageUrlsToRemove - An array of URLs of images to remove.
   * @returns The updated raw leather entry or null.
   */
  public async removeRawLeatherImages(id: string, imageUrlsToRemove: string[]): Promise<IRawLeather | null> {
    try {
      const rawLeather = await RawLeather.findById(id);
      if (!rawLeather) {
        return null;
      }

      const imagesToDeletePublicIds: string[] = [];
      const updatedImages = rawLeather.images.filter((imgUrl) => {
        const shouldRemove = imageUrlsToRemove.includes(imgUrl);
        if (shouldRemove) {
          const parts = imgUrl.split('/');
          const folderIndex = parts.indexOf('raw-leather');
          if (folderIndex > -1 && parts.length > folderIndex + 1) {
            const publicIdWithExt = parts.slice(folderIndex + 1).join('/').split('.')[0];
            imagesToDeletePublicIds.push(`raw-leather/${publicIdWithExt}`);
          } else {
             logger.warn(`Could not extract public ID for removal from URL: ${imgUrl}`);
          }
        }
        return !shouldRemove;
      });

      if (updatedImages.length === rawLeather.images.length) {
        logger.warn(`No matching images found to remove for raw leather ID: ${id}`);
        return rawLeather;
      }

      for (const publicId of imagesToDeletePublicIds) {
        try {
          await cloudinary.uploader.destroy(publicId);
          logger.info(`Deleted Cloudinary image: ${publicId}`);
        } catch (imgDeleteError: any) {
          logger.error(`Failed to delete Cloudinary raw leather image ${publicId}: ${imgDeleteError.message}`);
        }
      }

      rawLeather.images = updatedImages;
      await rawLeather.save();
      logger.info(`Removed images from raw leather ID: ${id}`);
      return rawLeather;
    } catch (error: any) {
      logger.error(`Error removing images from raw leather ID ${id}: ${error.message}`);
      throw error;
    }
  }
}

export default new RawLeatherService();