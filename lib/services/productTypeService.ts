import ProductType, { IProductType } from "../models/ProductType";
import logger from "../config/logger";

class ProductTypeService {
  /**
   * Creates a new product type.
   * @param name - The name of the product type.
   * @returns The created product type.
   */
  public async createProductType(name: string): Promise<IProductType> {
    try {
      const newProductType = new ProductType({ name });
      await newProductType.save();
      logger.info(`Created new product type: ${name}`);
      return newProductType;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error("Product type with this name already exists.");
      }
      logger.error(`Error creating product type '${name}': ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves all product types.
   * @returns An array of product types.
   */
  public async getAllProductTypes(): Promise<IProductType[]> {
    try {
      const productTypes = await ProductType.find().sort({ name: 1 }).exec();
      logger.info(`Retrieved ${productTypes.length} product types.`);
      return productTypes;
    } catch (error: any) {
      logger.error(`Error getting all product types: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves a single product type by its ID.
   * @param id - The ID of the product type.
   * @returns The found product type or null.
   */
  public async getProductTypeById(id: string): Promise<IProductType | null> {
    try {
      const productType = await ProductType.findById(id);
      if (productType) {
        logger.info(`Retrieved product type by ID: ${id}`);
      } else {
        logger.warn(`Product type not found by ID: ${id}`);
      }
      return productType;
    } catch (error: any) {
      logger.error(`Error getting product type by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates an existing product type.
   * @param id - The ID of the product type to update.
   * @param newName - The new name for the product type.
   * @returns The updated product type or null.
   */
  public async updateProductType(
    id: string,
    newName: string,
  ): Promise<IProductType | null> {
    try {
      const updatedProductType = await ProductType.findByIdAndUpdate(
        id,
        { name: newName },
        { new: true, runValidators: true },
      );
      if (updatedProductType) {
        logger.info(`Updated product type ID: ${id} to name: ${newName}`);
      } else {
        logger.warn(`Product type not found for update by ID: ${id}`);
      }
      return updatedProductType;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error("Product type with this name already exists.");
      }
      logger.error(
        `Error updating product type ID ${id} to ${newName}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Deletes a product type by its ID.
   * @param id - The ID of the product type to delete.
   * @returns True if deleted, false if not found.
   */
  public async deleteProductType(id: string): Promise<boolean> {
    try {
      const result = await ProductType.findByIdAndDelete(id);
      if (result) {
        logger.info(`Deleted product type ID: ${id}`);
        return true;
      } else {
        logger.warn(`Product type not found for deletion by ID: ${id}`);
        return false;
      }
    } catch (error: any) {
      logger.error(`Error deleting product type ID ${id}: ${error.message}`);
      throw error;
    }
  }
}

export default new ProductTypeService();