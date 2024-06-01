"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

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
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${inputCurrency}`
      );
      const rate = response.data.rates[outputCurrency];
      setResult(
        (Number(inputValue.replace(/[^0-9.]/g, "")) * rate).toLocaleString()
      );
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

  const handleValueChange = (value: string) => {
    setInputValue(value.replace(/[^0-9.]/g, ""));
  };

  return (
    <div className="min-h-[100svh] text-black flex flex-col items-center justify-center bg-gray-100 p-2">
      <div className="w-full max-w-md">
        <div className="mb-2 flex space-x-2">
          <div className="w-full">
            <input
              type="text"
              className="w-full h-full p-2 text-2xl rounded"
              value={inputValue}
              onChange={(e) => handleValueChange(e.target.value)}
            />
          </div>
          <select
            className="w-28 px-4 py-2 text-xl border rounded overflow-hidden"
            value={inputCurrency}
            onChange={(e) => setInputCurrency(e.target.value)}
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4 flex space-x-2">
          <div className="w-full">
            <div className="w-full h-full p-2 text-2xl border rounded">
              {result}
            </div>
          </div>
          <select
            className="w-28 px-4 py-2 text-xl border rounded overflow-hidden"
            value={outputCurrency}
            onChange={(e) => setOutputCurrency(e.target.value)}
          >
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
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
