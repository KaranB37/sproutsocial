import axios from "axios";
import { extractCustomerId } from "@/utils/profileHelpers";

/**
 * API proxy handler for post metrics
 *
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Log received request (filter out sensitive data)
    console.log(
      "Received YouTube post metrics request with fields:",
      req.body.fields,
      "filters:",
      req.body.filters,
      "metrics count:",
      req.body.metrics?.length || 0
    );

    if (
      !req.body.filters ||
      !Array.isArray(req.body.filters) ||
      req.body.filters.length === 0
    ) {
      return res.status(400).json({ error: "Missing required filters" });
    }

    if (
      !req.body.metrics ||
      !Array.isArray(req.body.metrics) ||
      req.body.metrics.length === 0
    ) {
      return res.status(400).json({ error: "Missing required metrics" });
    }

    // Get API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_SPROUT_API_TOKEN;

    if (!apiKey) {
      console.warn(
        "NEXT_PUBLIC_SPROUT_API_TOKEN not found in environment variables"
      );
      return res.status(500).json({ error: "API key not configured" });
    }

    // Extract customer_id from filters
    let customerId = null;
    // Look for customer_profile_id filter to extract the customer ID
    const profileIdFilter = req.body.filters.find((filter) =>
      filter.includes("customer_profile_id.eq")
    );

    if (profileIdFilter) {
      // Extract the profile ID
      const profileIdMatch = profileIdFilter.match(
        /customer_profile_id\.eq\((\d+)\)/
      );
      if (profileIdMatch && profileIdMatch[1]) {
        const profileId = profileIdMatch[1];
        // Get the customer ID from query params or extract from the profile ID
        customerId = req.query.customerId || extractCustomerId(profileId);
        console.log(
          `Extracted customer ID: ${customerId} from profile ID: ${profileId}`
        );
      }
    }

    if (!customerId) {
      customerId = req.query.customerId;
      console.log(`Using customer ID from query: ${customerId}`);
    }

    if (!customerId) {
      console.error("Unable to determine customer ID", {
        profileIdFilter,
        filters: req.body.filters,
        query: req.query,
      });
      return res.status(400).json({
        error: "Unable to determine customer ID",
        details: {
          profileFilter: profileIdFilter || "No profile filter found",
          queryCustomerId: req.query.customerId || "Not provided in query",
        },
      });
    }

    // Construct the API request to Sprout Social with customer ID in the path
    const apiUrl = `https://api.sproutsocial.com/v1/${customerId}/analytics/posts`;
    console.log(`Forwarding request to Sprout API: ${apiUrl}`);
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    // Forward the request body as-is
    const response = await axios.post(apiUrl, req.body, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 second timeout
    });

    // Log summary of response
    console.log(`Post metrics API response status: ${response.status}`);
    const dataCount = response.data?.data?.length || 0;
    console.log(`Post metrics data received: ${dataCount} posts`);

    if (dataCount > 0) {
      // Log first post timestamp to help debug
      console.log(
        `First post created time: ${response.data.data[0].created_time}`
      );

      // Log available metrics in the first post
      const firstPostMetrics = response.data.data[0].metrics || {};
      console.log(
        `Available metrics in first post: ${Object.keys(firstPostMetrics).join(
          ", "
        )}`
      );

      // Check if we have any missing metrics
      const missingMetrics = [];
      req.body.metrics.forEach((metric) => {
        if (firstPostMetrics[metric] === undefined) {
          missingMetrics.push(metric);
        }
      });

      if (missingMetrics.length > 0) {
        console.warn(
          `Missing metrics in response: ${missingMetrics.join(", ")}`
        );
      }
    } else {
      console.log(
        "No posts found in the response. Check date range and profile ID."
      );
    }

    // Return the API response
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching post metrics data:", error.message);

    if (error.response) {
      // Log detailed error from Sprout API
      console.error("Sprout API error details:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
        config: {
          url: error.response.config?.url,
          method: error.response.config?.method,
          headers: error.response.config?.headers
            ? { ...error.response.config.headers, Authorization: "REDACTED" }
            : "Headers not available",
          data: error.response.config?.data,
        },
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received from Sprout API:", {
        request: error.request._currentUrl || "URL not available",
        error: error.message,
      });
    } else {
      // Something happened in setting up the request
      console.error("Error setting up request:", error.message);
    }

    // Return appropriate error response
    const statusCode = error.response?.status || 500;
    const errorMessage =
      error.response?.data?.error || error.message || "Internal server error";

    return res.status(statusCode).json({
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
