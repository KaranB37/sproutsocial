import axios from "axios";

export default async function handler(req, res) {
  // Set CORS headers for our own endpoint
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const { path } = req.query;
    const apiPath = Array.isArray(path) ? path.join("/") : path;

    console.log(`Proxying request to: ${apiPath}`);

    const response = await axios({
      method: req.method,
      url: `https://api.sproutsocial.com/v1/${apiPath}`,
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SPROUT_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: req.method !== "GET" ? req.body : undefined,
    });

    console.log(`Proxy response status: ${response.status}`);
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Proxy error:", error.message);
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { message: "Internal server error" });
  }
}
