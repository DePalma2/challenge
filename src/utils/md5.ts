import { createHash } from "crypto";

/**
 * Serializa un valor JSON de forma canónica.
 * Garantiza que el hash MD5 sea determinista
 * independientemente del orden en que el cliente envíe las propiedades del JSON.
 */
export function canonicalJsonStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalJsonStringify(item));
    return `[${items.join(",")}]`;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sortedKeys = Object.keys(obj).sort();
    const entries = sortedKeys.map(
      (key) => `${JSON.stringify(key)}:${canonicalJsonStringify(obj[key])}`
    );
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}

/**
 * Calcula el hash MD5 de un valor JSON.
 *
 * El proceso:
 * 1. Serializa el JSON con keys ordenadas recursivamente
 * 2. Calcula el MD5 del string resultante
 * 3. Retorna el hash en formato hexadecimal
 *
 * @param jsonBody - El objeto/valor JSON a hashear
 * @returns Hash MD5 en formato hexadecimal
 */
export function computeMd5(jsonBody: unknown): string {
  const canonical = canonicalJsonStringify(jsonBody);
  return createHash("md5").update(canonical, "utf8").digest("hex");
}
