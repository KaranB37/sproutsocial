import axios from "axios";

/**
 * Get analytics data using filter-based approach
 * @param {Object} params - Parameters for the analytics request
 * @returns {Promise<Object>} Analytics data
 */
export const getAnalyticsWithFilters = async ({
  customerId,
  filters,
  metrics,
  page = 1,
}) => {
  try {
    // Create a properly formatted request object
    const requestData = {
      filters: Array.isArray(filters) ? filters : [],
      metrics: Array.isArray(metrics) ? metrics : [],
      page,
    };

    console.log("Filter Analytics Request:", JSON.stringify(requestData, null, 2));

    // Use the proxy path to avoid CORS issues
    const apiUrl = `/api/proxy/analytics/profiles?customerId=${customerId}`;
    
    const response = await axios.post(apiUrl, requestData);
    
    console.log(`Filter Analytics Response: ${response.data.data?.length || 0} profile(s) with data`);
    
    return response.data;
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    throw error;
  }
};

/**
 * Get analytics data for a specific profile
 * @param {Object} params - Parameters for the analytics request
 * @returns {Promise<Object>} Analytics data
 */
export const getProfileAnalytics = async ({
  customerId,
  profileId,
  startDate,
  endDate,
  reportingPeriod,
  metrics,
}) => {
  try {
    // Make sure profileId is properly formatted as an array
    const profileIds = Array.isArray(profileId) ? profileId : [profileId];
    
    // Construct filters in the format required by Sprout Social API
    const filters = [];
    
    // Add profile ID filters
    if (profileIds.length > 0) {
      const profileFilter = `customer_profile_id.eq(${profileIds.join(',')})`;
      filters.push(profileFilter);
    }
    
    // Add date range filter
    if (startDate && endDate) {
      const dateFilter = `reporting_period.in(${startDate}...${endDate})`;
      filters.push(dateFilter);
    }

    // Create a properly formatted request object
    const requestData = {
      filters: filters,
      metrics: Array.isArray(metrics) ? metrics : [],
      page: 1
    };

    console.log("Profile Analytics Request:", JSON.stringify(requestData, null, 2));

    // Use the correct URL format with the customer ID in the path
    const apiUrl = `/api/proxy/${customerId}/analytics/profiles`;
    
    const response = await axios.post(apiUrl, requestData);
    
    if (response && response.data) {
      console.log(`Profile Analytics Response: ${response.data.data?.length || 0} data points received`);
    }
    
    return response.data;
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    throw error;
  }
};
