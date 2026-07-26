export const CURRENCIES = [
  { value: 'ARS', symbol: '$' },
  { value: 'USD', symbol: 'US$' },
  { value: 'EUR', symbol: '€' },
  { value: 'GBP', symbol: '£' },
  { value: 'BRL', symbol: 'R$' },
]

export function currencySymbol(value) {
  return CURRENCIES.find((c) => c.value === value)?.symbol || '$'
}
