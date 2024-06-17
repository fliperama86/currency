export const dynamic = "force-dynamic"; // defaults to auto
import axios from "axios";

const API_KEY = process.env.API_KEY;

async function googleFinance(input: string, output: string) {
  const reqId = Math.floor(Math.random() * 1000000000);
  const epoch = Date.now();
  const response = await axios.post(
    `https://www.google.com/finance/_/GoogleFinanceUi/data/batchexecute?rpcids=mKsvE&source-path=%2Ffinance%2F&f.sid=-5491054115789561107&bl=boq_finance-ui_20240610.00_p0&hl=en&soc-app=162&soc-platform=1&soc-device=1&_reqid=${reqId}&rt=c`,
    `f.req=%5B%5B%5B%22mKsvE%22%2C%22%5B%5C%22${input}%20%2F%20${output}%5C%22%2Cnull%2C1%2C1%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&at=ANXCC_Dl_ES6FZZv-q32dnvIA2Yd%3A${epoch}&`
  );
  const value = (response.data as string).match(
    /\[(?<value>([0-9]*[.])?[0-9]+),/
  )!.groups!.value;
  return Number(value);
}

export async function GET(request: Request) {
  const params = new URLSearchParams(new URL(request.url).searchParams);
  const input = params.get("input") || "USD";
  const output = params.get("output") || "BRL";
  let value: number | undefined;
  for (let i = 0; i < 3; i++) {
    try {
      value = await googleFinance(input, output);
      break;
    } catch (error) {
      console.error(error);
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i));
    }
  }
  return Response.json(Number(value));
}
