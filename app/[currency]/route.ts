export const dynamic = "force-dynamic"; // defaults to auto
import axios from "axios";

const API_KEY = process.env.API_KEY;

export async function GET(
  _: Request,
  { params }: { params: { currency: string } }
) {
  const { currency } = params;
  const response = await axios.get(
    `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${currency}`
  );
  return Response.json(response.data.conversion_rates);
}
