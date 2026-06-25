export function shortTime(value: string): string {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function displayNumber(value: number | undefined): string {
  return value === undefined ? '-' : value.toString();
}
