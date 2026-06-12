import { z } from "zod";

export async function getJson<T>(
  url: string,
  schema: z.ZodSchema<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const errorBody = await response.text();
    const details = errorBody.trim();
    const suffix = details ? ` - ${details}` : "";
    throw new Error(`Request failed with ${response.status}: ${url}${suffix}`);
  }

  return schema.parse(await response.json());
}
