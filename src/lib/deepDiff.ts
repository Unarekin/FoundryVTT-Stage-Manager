/**
 * Returns a deep object with properties in obj2 that do not match properties in obj1
 * @param obj1 
 * @param obj2 
 * @returns 
 */
export function diff(obj1: Record<string, unknown>, obj2: Record<string, unknown>): Record<string, unknown> {
  const diffObj: Record<string, unknown> = {};
  for (const key in obj1) {
    if (Object.prototype.hasOwnProperty.call(obj2, key)) {
      if (typeof obj1[key] === "object" && typeof obj2[key] === "object") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const nested = diff(obj1[key] as any, obj2[key] as any);
        if (Object.keys(nested).length > 0)
          diffObj[key] = nested;
      } else if (obj1[key] !== obj2[key]) {
        diffObj[key] = obj2[key];
      }
    } else {
      diffObj[key] = undefined;
    }
  }

  for (const key in obj2) {
    if (!Object.prototype.hasOwnProperty.call(obj1, key)) {
      diffObj[key] = obj2[key]
    }
  }

  return diffObj;
}
