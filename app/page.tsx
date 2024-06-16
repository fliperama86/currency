"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

const flags = ["🇧🇷", "🇺🇸", "🇪🇺", "🇬🇧", "🇯🇵"];
const currencies = ["BRL", "USD", "EUR", "GBP", "JPY"];

const CurrencyConverter = () => {
  const [inputValue, setInputValueState] = useState("0");
  const [inputCurrency, setInputCurrency] = useState("USD");
  const [outputCurrency, setOutputCurrency] = useState("BRL");
  const [result, setResult] = useState("0");

  useEffect(() => {
    if (inputValue !== "") {
      convertCurrency();
    }
  }, [inputValue, inputCurrency, outputCurrency]);

  const convertCurrency = async () => {
    try {
      const inputNumber = Number(inputValue.replace(/[^0-9.]/g, ""));
      const response = await axios.get(`/${inputCurrency}`);
      const rate = response.data[outputCurrency];
      const result = inputNumber * rate;
      setResult(Number(result).toLocaleString());
    } catch (error) {
      console.error("Error fetching conversion rates", error);
    }
  };

  const setInputValue = (value: string) => {
    let newValue = Number(value.replace(/[^0-9.]/g, "")) ?? 0;
    setInputValueState(newValue.toLocaleString());
  };

  const handleKeyPress = (key: string) => {
    if (key === "C") {
      setInputValue("");
    } else if (key === "←" && inputValue.length > 0) {
      setInputValue(inputValue.slice(0, -1));
    } else {
      setInputValue(inputValue + key);
    }
    if (inputValue === "") {
      setInputValue("0");
    }
  };

  const swapCurrencies = () => {
    setInputCurrency(outputCurrency);
    setOutputCurrency(inputCurrency);
  };

  const handleValueChange = (value: string) => {
    setInputValue(value.replace(/[^0-9.]/g, ""));
  };

  return (
    <div className="min-h-[100svh] text-black flex flex-col items-center justify-center bg-gray-100 p-2">
      <div className="w-full max-w-md space-y-2">
        <div className="flex w-full space-x-2">
          {currencies.map((currency) => (
            <div
              key={`in_${currency}`}
              onClick={() => setInputCurrency(currency)}
              className={`rounded-sm text-3xl flex justify-center flex-grow border cursor-default ${
                inputCurrency === currency
                  ? "border-blue-500 bg-blue-100"
                  : "border-gray-300 bg-white"
              }`}
            >
              {flags[currencies.indexOf(currency)]}
            </div>
          ))}
        </div>
        <div className="mb-2 flex space-x-2">
          <div className="w-full">
            <input
              type="text"
              className="w-full h-full p-2 text-2xl rounded"
              value={inputValue}
              onChange={(e) => handleValueChange(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full justify-center flex">
          <button
            onClick={swapCurrencies}
            className="px-2 py-1 text-3xl bg-gray-200 rounded-sm border border-gray-300"
          >
            🔄
          </button>
        </div>
        <div className="flex w-full space-x-2">
          {currencies.map((currency) => (
            <div
              key={`out_${currency}`}
              onClick={() => setOutputCurrency(currency)}
              className={`bg-white rounded-sm text-3xl flex justify-center flex-grow border cursor-default ${
                outputCurrency === currency
                  ? "border-blue-500 bg-blue-100"
                  : "border-gray-300 bg-white"
              }`}
            >
              {flags[currencies.indexOf(currency)]}
            </div>
          ))}
        </div>
        <div className="mb-4 flex space-x-2">
          <div className="w-full">
            <div className="w-full h-full p-2 text-2xl border rounded">
              {result}
            </div>
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
