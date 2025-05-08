import { NextResponse } from "next/server";
import axios from "axios";

// Simple in-memory cache
let cachedRates: {
  rates: { [key: string]: number };
  timestamp: number;
} | null = null;
const CACHE_DURATION_MS = 10 * 60 * 1000; // Cache for 10 minutes for semi-real-time data

export const dynamic = "force-dynamic";

// Copied from app/api/pair/route.ts and modified regex
async function googleFinance(input: string, output: string): Promise<number> {
  const reqId = Math.floor(Math.random() * 1000000000);
  const epoch = Date.now();
  try {
    const response = await axios.post(
      `https://www.google.com/finance/_/GoogleFinanceUi/data/batchexecute?rpcids=mKsvE&source-path=%2Ffinance%2F&f.sid=-5491054115789561107&bl=boq_finance-ui_20240610.00_p0&hl=en&soc-app=162&soc-platform=1&soc-device=1&_reqid=${reqId}&rt=c`,
      `f.req=%5B%5B%5B%22mKsvE%22%2C%22%5B%5C%22${input}%20%2F%20${output}%5C%22%2Cnull%2C1%2C1%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&at=ANXCC_Dl_ES6FZZv-q32dnvIA2Yd%3A${epoch}&`
    );
    // Updated regex to handle scientific notation (e.g., 1.23E-5)
    const match = (response.data as string).match(
      /\[((?:[0-9]*\.)?[0-9]+(?:[eE][-+]?[0-9]+)?),/
    );
    if (match && match[1]) {
      return Number(match[1]);
    } else {
      throw new Error(
        `Could not parse rate for ${input}/${output} from response: ${response.data}`
      );
    }
  } catch (error: any) {
    console.error(`googleFinance Error for ${input}/${output}:`, error.message);
    // Augment the error with the specific currency pair for better context in Promise.allSettled
    const enhancedError = new Error(`Failed to fetch rate for ${input}/${output}: ${error.message}`);
    (enhancedError as any).currencyPair = `${input}/${output}`;
    throw enhancedError;
  }
}

// Renamed function and implemented Promise.allSettled logic
async function fetchRatesFromGoogleParallel() {
  const targetCurrencies = ["BRL", "USD", "GBP", "JPY", "BTC"];

  const promises = targetCurrencies.map((currency) =>
    googleFinance("EUR", currency)
      .then((response) => { console.log(response); return response })
      .then((rate) => ({ currency, rate })) // Resolve with an object containing currency and rate
      .catch((error) => {
        // Ensure the error object is passed along for Promise.allSettled
        // The currencyPair should be on the error from googleFinance
        return Promise.reject(error); 
      })
  );

  try {
    const results = await Promise.allSettled(promises);
    const rates: { [key: string]: number } = { EUR: 1 };

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        if (result.value && typeof result.value.rate === "number") {
          rates[result.value.currency] = result.value.rate;
        } else {
          console.warn(
            `Google Finance fetch fulfilled but rate missing or invalid:`,
            result.value
          );
        }
      } else {
        // Error handling: result.reason is the error thrown from googleFinance
        const reason = result.reason as any; // Cast to access custom properties
        const currencyPair = reason.currencyPair || `EUR/unknown`; // Fallback if currencyPair isn't set
        console.error(
          `Failed to fetch rate for ${currencyPair}:`,
          reason.message || reason
        );
      }
    });

    if (Object.keys(rates).length <= 1 && targetCurrencies.length > 0) {
      // Only throw if we have target currencies but couldn't fetch any
      throw new Error(
        "Failed to fetch any currency rates from Google Finance."
      );
    }

    cachedRates = { rates, timestamp: Date.now() };
    console.log("Fetched and cached new rates from Google Finance:", rates);
    return rates;
  } catch (error) {
    console.error("Error during fetchRatesFromGoogleParallel:", error);
    if (cachedRates &&Date.now() - cachedRates.timestamp < CACHE_DURATION_MS * 2) {
      console.warn("Returning stale cache due to fetch error.");
      return cachedRates.rates;
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Failed to fetch rates via Google Finance and no usable cache available: ${message}`
    );
  }
}

export async function GET() {
  const now = Date.now();

  // Use shorter cache duration for more frequent updates
  if (cachedRates && now - cachedRates.timestamp < CACHE_DURATION_MS) {
    console.log("Returning cached rates (Google Finance).");
    return NextResponse.json(cachedRates.rates);
  }

  console.log(
    "Cache expired or empty, fetching new rates from Google Finance..."
  );
  try {
    // Call the new function using parallel Google fetches
    const rates = await fetchRatesFromGoogleParallel();
    return NextResponse.json(rates);
  } catch (error: any) {
    console.error("GET /api/rates error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch rates: " + error.message },
      { status: 500 }
    );
  }
}
