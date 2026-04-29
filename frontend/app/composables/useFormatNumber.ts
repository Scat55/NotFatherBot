export function useNumberFormat(locale = "ru-RU") {
  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  });

  const format = (value: number | string) => {
    const num = typeof value === "string" ? Number(value) : value;
    if (isNaN(num)) return "";
    return formatter.format(num);
  };

  return {
    format,
  };
}
