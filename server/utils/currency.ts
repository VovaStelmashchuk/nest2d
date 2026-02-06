export const CountryCurrencyMapping: Record<string, string> = {
    // Eurozone
    'AT': 'eur', 'BE': 'eur', 'CY': 'eur', 'EE': 'eur', 'FI': 'eur', 'FR': 'eur',
    'DE': 'eur', 'GR': 'eur', 'IE': 'eur', 'IT': 'eur', 'LV': 'eur', 'LT': 'eur',
    'LU': 'eur', 'MT': 'eur', 'NL': 'eur', 'PT': 'eur', 'SK': 'eur', 'SI': 'eur',
    'ES': 'eur', 'PL': 'eur',

    'UA': 'uah',
    'US': 'usd',
}

export function getCurrencyByCountry(countryCode: string | undefined | null): string {
    if (!countryCode) {
        return 'usd'
    }
    const code = countryCode.toUpperCase()
    return CountryCurrencyMapping[code] || 'usd'
}
