/** Formatuje liczbę zgodnie z polską konwencją (przecinek dziesiętny), bez jednostki. */
export function formatPlnNumber(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

/** Formatuje kwotę w złotówkach zgodnie z polską konwencją (przecinek dziesiętny). */
export function formatPln(value: number): string {
  return `${formatPlnNumber(value)} zł`;
}

/** Formatuje zakres kosztu, np. "12,34–15,67 zł". */
export function formatPlnRange(min: number, max: number): string {
  return `${formatPlnNumber(min)}–${formatPlnNumber(max)} zł`;
}
