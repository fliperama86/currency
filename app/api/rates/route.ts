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
    // Fix: Use numbered capture group instead of named group 'value'
    const match = (response.data as string).match(/\[(([0-9]*[.])?[0-9]+),/);
    if (match && match[1]) {
      return Number(match[1]);
    } else {
      // Throw error if regex doesn't match expected format
      throw new Error(
        `Could not parse rate for ${input}/${output} from response: ${response.data}`
      );
    }
  } catch (error: any) {
    // Re-throw error with more context
    console.error(`googleFinance Error for ${input}/${output}:`, error.message);
    throw new Error(
      `Failed to fetch rate for ${input}/${output}: ${error.message}`
    );
  }
}

// Renamed function and implemented Promise.allSettled logic
async function fetchRatesFromGoogleParallel() {
  // Define target currencies (based on currencies used in page.tsx)
  const targetCurrencies = ["BRL", "USD", "GBP", "JPY"]; // Exclude EUR

  // Create promises for each currency pair
  const promises = targetCurrencies.map(
    (currency) =>
      googleFinance("EUR", currency).then((rate) => ({ currency, rate })) // Resolve with an object containing currency and rate
  );

  try {
    // Use Promise.allSettled to handle individual failures
    const results = await Promise.allSettled(promises);

    const rates: { [key: string]: number } = { EUR: 1 }; // Initialize with EUR base

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        // Check if result.value exists and has rate
        if (result.value && typeof result.value.rate === "number") {
          // Access the currency and rate from the fulfilled promise's value
          rates[result.value.currency] = result.value.rate;
        } else {
          // This case might occur if googleFinance resolves unexpectedly
          console.warn(
            `Google Finance fetch fulfilled but rate missing or invalid:`,
            result.value
          );
        }
      } else {
        // Log the reason for rejection
        // Attempt to get currency from the error object if we attached it, otherwise log generic error
        const currency =
          result.reason instanceof Error && (result.reason as any).currency
            ? (result.reason as any).currency
            : "unknown";
        console.error(
          `Failed to fetch rate for EUR/${currency}:`,
          result.reason?.message || result.reason
        );
      }
    });

    // Check if we got *any* rates other than the base EUR
    if (Object.keys(rates).length <= 1) {
      throw new Error(
        "Failed to fetch any currency rates from Google Finance."
      );
    }

    cachedRates = { rates, timestamp: Date.now() };
    console.log("Fetched and cached new rates from Google Finance:", rates);
    return rates;
  } catch (error) {
    console.error("Error during fetchRatesFromGoogleParallel:", error);
    // Attempt to return stale cache if available
    if (
      cachedRates &&
      Date.now() - cachedRates.timestamp < CACHE_DURATION_MS * 2
    ) {
      console.warn("Returning stale cache due to fetch error.");
      return cachedRates.rates;
    }
    // Ensure error is an instance of Error before accessing message
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
