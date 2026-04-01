import { createContext, useContext, useState, ReactNode } from "react";

export type Currency = "USD" | "EUR" | "GBP" | "SAR" | "AED" | "EGP" | "KWD" | "QAR";

interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  nameAr: string;
  locale: string;
}

export const currencies: CurrencyInfo[] = [
  { code: "USD", symbol: "$", name: "US Dollar", nameAr: "دولار أمريكي", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", nameAr: "يورو", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "British Pound", nameAr: "جنيه إسترليني", locale: "en-GB" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", nameAr: "ريال سعودي", locale: "ar-SA" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", nameAr: "درهم إماراتي", locale: "ar-AE" },
  { code: "EGP", symbol: "£", name: "Egyptian Pound", nameAr: "جنيه مصري", locale: "ar-EG" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar", nameAr: "دينار كويتي", locale: "ar-KW" },
  { code: "QAR", symbol: "﷼", name: "Qatari Riyal", nameAr: "ريال قطري", locale: "ar-QA" },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  fmt: (n: number) => string;
  currencyInfo: CurrencyInfo;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem("currency") as Currency | null;
    return saved && currencies.some(c => c.code === saved) ? saved : "USD";
  });

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("currency", c);
  };

  const currencyInfo = currencies.find(c => c.code === currency)!;

  const fmt = (n: number) =>
    new Intl.NumberFormat(currencyInfo.locale, {
      style: "currency",
      currency: currencyInfo.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, fmt, currencyInfo }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
