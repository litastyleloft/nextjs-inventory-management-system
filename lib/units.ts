/** Product units and their Thai labels. The design fixes products to yards. Client-safe. */
export const UNIT_LABEL: Record<string, { name: string; short: string }> = {
  yard: { name: "หลา", short: "หลา" },
};
export const unitLabel = (unit: string) => UNIT_LABEL[unit] ?? { name: unit, short: unit };
