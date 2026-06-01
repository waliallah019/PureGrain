import RawLeatherType, { IRawLeatherType } from "../models/RawLeatherType";
import logger from "../config/logger";

class RawLeatherTypeService {
  /**
   * Creates a new raw leather type.
   * @param name - The name of the raw leather type.
   * @returns The created raw leather type.
   */
  public async createRawLeatherType(name: string): Promise<IRawLeatherType> {
    try {
      const newRawLeatherType = new RawLeatherType({ name });
      await newRawLeatherType.save();
      logger.info(`Created new raw leather type: ${name}`);
      return newRawLeatherType;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error("Raw leather type with this name already exists.");
      }
      logger.error(`Error creating raw leather type '${name}': ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves all raw leather types.
   * @returns An array of raw leather types.
   */
  public async getAllRawLeatherTypes(): Promise<IRawLeatherType[]> {
    try {
      const rawLeatherTypes = await RawLeatherType.find().sort({ name: 1 }).exec();
      logger.info(`Retrieved ${rawLeatherTypes.length} raw leather types.`);
      return rawLeatherTypes;
    } catch (error: any) {
      logger.error(`Error getting all raw leather types: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieves a single raw leather type by its ID.
   * @param id - The ID of the raw leather type.
   * @returns The found raw leather type or null.
   */
  public async getRawLeatherTypeById(id: string): Promise<IRawLeatherType | null> {
    try {
      const rawLeatherType = await RawLeatherType.findById(id);
      if (rawLeatherType) {
        logger.info(`Retrieved raw leather type by ID: ${id}`);
      } else {
        logger.warn(`Raw leather type not found by ID: ${id}`);
      }
      return rawLeatherType;
    } catch (error: any) {
      logger.error(`Error getting raw leather type by ID ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Updates an existing raw leather type.
   * @param id - The ID of the raw leather type to update.
   * @param newName - The new name for the raw leather type.
   * @returns The updated raw leather type or null.
   */
  public async updateRawLeatherType(
    id: string,
    newName: string,
  ): Promise<IRawLeatherType | null> {
    try {
      const updatedRawLeatherType = await RawLeatherType.findByIdAndUpdate(
        id,
        { name: newName },
        { new: true, runValidators: true },
      );
      if (updatedRawLeatherType) {
        logger.info(`Updated raw leather type ID: ${id} to name: ${newName}`);
      } else {
        logger.warn(`Raw leather type not found for update by ID: ${id}`);
      }
      return updatedRawLeatherType;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error("Raw leather type with this name already exists.");
      }
      logger.error(
        `Error updating raw leather type ID ${id} to ${newName}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Deletes a raw leather type by its ID.
   * @param id - The ID of the raw leather type to delete.
   * @returns True if deleted, false if not found.
   */
  public async deleteRawLeatherType(id: string): Promise<boolean> {
    try {
      const result = await RawLeatherType.findByIdAndDelete(id);
      if (result) {
        logger.info(`Deleted raw leather type ID: ${id}`);
        return true;
      } else {
        logger.warn(`Raw leather type not found for deletion by ID: ${id}`);
        return false;
      }
    } catch (error: any) {
      logger.error(`Error deleting raw leather type ID ${id}: ${error.message}`);
      throw error;
    }
  }
}

export default new RawLeatherTypeService();