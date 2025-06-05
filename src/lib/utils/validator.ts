import type { z } from "zod";
import { fromZodError, type ValidationError } from "zod-validation-error";
import { ConcertCreateSchema } from "./assertions";

class Validator<T> {
  private zodSchema: z.ZodType<T>;

  constructor(zodSchema: z.ZodType<T>) {
    this.zodSchema = zodSchema;
  }

  /**
   * Validates the provided data against the Zod schema.
   * @param data The data to validate.
   * @returns The validated data.
   * @throws {ValidationError} If the data does not conform to the schema. {@link ValidationError}
   */
  validate(data: unknown): T {
    const result = this.zodSchema.safeParse(data);
    if (!result.success) {
      throw fromZodError(result.error, {
        prefix: "Validation Error",
      });
    }

    return result.data;
  }
}

export { Validator };

const ConcertCreateValidator = new Validator(ConcertCreateSchema);

export { ConcertCreateValidator };