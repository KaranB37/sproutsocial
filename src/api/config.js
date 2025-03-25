import axios from "axios";

const token = process.env.NEXT_PUBLIC_SPROUT_API_TOKEN;
if (!token) {
  console.error("NEXT_PUBLIC_SPROUT_API_TOKEN is not set");
}

// Create an instance that uses our Next.js API routes as a proxy
const axiosInstance = axios.create({
  baseURL: "/api/proxy",
  headers: {
    "Content-Type": "application/json",
  },
});

export { axiosInstance };
