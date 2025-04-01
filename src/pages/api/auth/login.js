import axios from "axios";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const response = await axios.post(
        "https://ssfinal.vercel.app/auth",
        req.body
      );
      
      res.status(200).json(response.data);
    } catch (error) {
      console.error("Login API error:", error);
      res.status(error.response?.status || 500).json({
        error: "Authentication failed",
        details: error.response?.data || "Please check your credentials"
      });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
