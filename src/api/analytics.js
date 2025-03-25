import { axiosInstance } from "./config";

export const getProfileAnalytics = async (
  customerId,
  profileIds,
  metrics,
  startDate,
  endDate
) => {
  try {
    // If customerId is undefined, try to get it from localStorage
    if (!customerId) {
      customerId = localStorage.getItem("customerId");
      if (!customerId) {
        throw new Error("Customer ID is required for analytics");
      }
    }

    // Log customer ID for debugging
    console.log("Customer ID in analytics request:", customerId);
    console.log("Profile IDs:", profileIds);

    // Format date range for API
    const formattedStartDate = startDate;
    const formattedEndDate = endDate;

    const requestBody = {
      filters: [
        `customer_profile_id.eq(${profileIds.join(", ")})`,
        `reporting_period.in(${formattedStartDate}...${formattedEndDate})`,
      ],
      metrics: metrics,
      page: 1,
    };

    // Log complete request details
    console.log("Analytics Request:", {
      customerId,
      url: `${customerId}/analytics/profiles`,
      body: JSON.stringify(requestBody, null, 2),
    });

    const response = await axiosInstance.post(
      `${customerId}/analytics/profiles`,
      requestBody
    );

    // Log response
    console.log("Analytics Response:", {
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    // Detailed error logging
    console.error("Error fetching analytics:", {
      error: error.response?.data || error.message,
      status: error.response?.status,
      config: error.config,
      customerId: customerId,
      profileIds: profileIds,
    });
    throw new Error("Failed to fetch analytics data");
  }
};
