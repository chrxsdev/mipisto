export const decimalTransformer = {
  to(value?: number | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    return value.toFixed(2);
  },
  from(value?: string | null): number | null {
    if (value === undefined || value === null) {
      return null;
    }

    return Number(value);
  },
};
