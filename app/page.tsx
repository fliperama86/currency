"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";

const flags = ["🇧🇷", "🇺🇸", "🇪🇺", "🇬🇧", "🇯🇵"];
const currencies = ["BRL", "USD", "EUR", "GBP", "JPY"];

const CurrencyConverter = () => {
  const [inputValue, setInputValueState] = useState("0");
  const [inputCurrency, setInputCurrency] = useState("USD");
  const [outputCurrency, setOutputCurrency] = useState("BRL");
  const [result, setResult] = useState("0");
  const [isLoading, setIsLoading] = useState(true);
  const [allRates, setAllRates] = useState<{ [key: string]: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllRates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get<{ [key: string]: number }>(
          "/api/rates"
        );
        setAllRates(response.data);
      } catch (err) {
        console.error("Error fetching conversion rates", err);
        setError("Failed to load conversion rates. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllRates();
  }, []);

  const inputValueNumber = useMemo(
    () => Number(inputValue.replace(/[^0-9.]/g, "")) || 0,
    [inputValue]
  );

  const convertCurrency = useCallback(
    (value: number) => {
      if (!allRates || error) {
        setResult("-");
        return;
      }
      if (inputCurrency === outputCurrency) {
        setResult(
          value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
        return;
      }

      const rateEurToInput = allRates[inputCurrency];
      const rateEurToOutput = allRates[outputCurrency];

      if (rateEurToInput && rateEurToOutput) {
        const conversionRate = rateEurToOutput / rateEurToInput;
        setResult(
          (conversionRate * value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      } else {
        console.warn(
          `Rate not found for ${inputCurrency} or ${outputCurrency}`
        );
        setResult("-");
        setError(
          `Could not find rate for ${inputCurrency} or ${outputCurrency}.`
        );
      }
    },
    [allRates, inputCurrency, outputCurrency, error]
  );

  const setInputValue = (value: string) => {
    if (value === "") {
      setInputValueState("0");
      return;
    }
    let cleanedValue = value.replace(/[^0-9.]/g, "");
    const parts = cleanedValue.split(".");
    if (parts.length > 2) {
      cleanedValue = parts[0] + "." + parts.slice(1).join("");
    }
    if (
      cleanedValue.length > 1 &&
      cleanedValue.startsWith("0") &&
      !cleanedValue.startsWith("0.")
    ) {
      cleanedValue = cleanedValue.substring(1);
    }

    setInputValueState(cleanedValue || "0");
  };

  const handleKeyPress = (key: string) => {
    let currentVal = inputValue === "0" ? "" : inputValue;

    if (key === "C") {
      setInputValue("");
    } else if (key === "←") {
      setInputValue(currentVal.slice(0, -1));
    } else if (key === ".") {
      if (!currentVal.includes(".")) {
        setInputValue(currentVal + key);
      }
    } else if (/[0-9]/.test(key)) {
      setInputValue(currentVal + key);
    }
  };

  const swapCurrencies = () => {
    setInputCurrency(outputCurrency);
    setOutputCurrency(inputCurrency);
  };

  useEffect(() => {
    convertCurrency(inputValueNumber);
  }, [
    convertCurrency,
    inputValueNumber,
    allRates,
    inputCurrency,
    outputCurrency,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-[100svh] flex justify-center items-center">
        Loading rates...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100svh] flex justify-center items-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] text-black flex flex-col items-center justify-center bg-gray-100 p-2">
      <div className="w-full max-w-md space-y-2">
        <div className="flex w-full space-x-2">
          {currencies.map((currency) => (
            <div
              key={`in_${currency}`}
              onClick={() => setInputCurrency(currency)}
              className={`rounded-sm text-3xl flex justify-center items-center flex-grow border cursor-pointer py-1 ${
                inputCurrency === currency
                  ? "border-blue-500 bg-blue-100 ring-2 ring-blue-300"
                  : "border-gray-300 bg-white hover:bg-gray-50"
              }`}
            >
              {flags[currencies.indexOf(currency)]}
            </div>
          ))}
        </div>
        <div className="mb-2 flex space-x-2">
          <input
            type="text"
            inputMode="decimal"
            className="w-full h-full p-2 text-3xl rounded border border-gray-300 text-right"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="w-full justify-center flex">
          <button
            onClick={swapCurrencies}
            className="p-2 text-3xl bg-gray-200 rounded-md border border-gray-300 hover:bg-gray-300 transition-colors"
          >
            🔄
          </button>
        </div>
        <div className="flex w-full space-x-2">
          {currencies.map((currency) => (
            <div
              key={`out_${currency}`}
              onClick={() => setOutputCurrency(currency)}
              className={`rounded-sm text-3xl flex justify-center items-center flex-grow border cursor-pointer py-1 ${
                outputCurrency === currency
                  ? "border-blue-500 bg-blue-100 ring-2 ring-blue-300"
                  : "border-gray-300 bg-white hover:bg-gray-50"
              }`}
            >
              {flags[currencies.indexOf(currency)]}
            </div>
          ))}
        </div>
        <div className="mb-4 flex space-x-2">
          <div className="w-full h-full p-2 text-3xl border rounded bg-gray-50 border-gray-300 text-right">
            {result}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "←"].map(
            (key) => (
              <button
                key={key}
                className="p-4 text-xl bg-blue-500 text-white rounded"
                onClick={() => handleKeyPress(key)}
              >
                {key}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;
