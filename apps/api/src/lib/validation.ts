import { z } from "zod";

export function parseQuery<T extends z.ZodType>(
  schema: T,
  query: unknown,
): z.infer<T> {
  return schema.parse(query);
}