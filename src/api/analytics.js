import axios from "axios";
import { extractCustomerId } from "@/utils/profileHelpers";

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

    console.log(
      "Filter Analytics Request:",
      JSON.stringify(requestData, null, 2)
    );

    // Use the proxy path to avoid CORS issues
    const apiUrl = `/api/proxy/analytics/profiles?customerId=${customerId}`;

    const response = await axios.post(apiUrl, requestData);
    console.log(response);

    console.log(
      `Filter Analytics Response: ${
        response.data.data?.length || 0
      } profile(s) with data`
    );

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
      const profileFilter = `customer_profile_id.eq(${profileIds.join(",")})`;
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
      page: 1,
    };

    console.log(
      "Profile Analytics Request:",
      JSON.stringify(requestData, null, 2)
    );

    // Use the correct URL format with the customer ID in the path
    const apiUrl = `/api/proxy/${customerId}/analytics/profiles`;

    const response = await axios.post(apiUrl, requestData);

    if (response && response.data) {
      console.log(response);
      console.log(
        `Profile Analytics Response: ${
          response.data.data?.length || 0
        } data points received`
      );
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    throw error;
  }
};

/**
 * Get YouTube post metrics data using the Sprout API
 * @param {Object} params - Parameters for the YouTube post metrics request
 * @returns {Promise<Object>} YouTube post metrics data
 */
export const getYoutubePostMetrics = async ({
  profileId,
  customerId,
  startDate,
  endDate,
  timezone = "America/Chicago",
  page = 1,
}) => {
  try {
    if (!profileId) {
      throw new Error("Missing required parameter: profileId");
    }

    if (!startDate || !endDate) {
      throw new Error("Missing required date parameters");
    }

    console.log(
      `getYoutubePostMetrics: Starting request for profile ${profileId}`
    );

    // YouTube metrics from the provided sample
    const youtubePostMetrics = [
      "lifetime.annotation_clicks",
      "lifetime.annotation_click_through_rate",
      "lifetime.annotation_clickable_impressions",
      "lifetime.annotation_closable_impressions",
      "lifetime.annotation_closes",
      "lifetime.annotation_close_rate",
      "lifetime.annotation_impressions",
      "lifetime.card_clicks",
      "lifetime.card_impressions",
      "lifetime.card_click_rate",
      "lifetime.card_teaser_clicks",
      "lifetime.card_teaser_impressions",
      "lifetime.card_teaser_click_rate",
      "lifetime.estimated_minutes_watched",
      "lifetime.estimated_red_minutes_watched",
      "lifetime.post_content_clicks_other",
      "lifetime.shares_count",
      "lifetime.subscribers_gained",
      "lifetime.subscribers_lost",
      "lifetime.red_video_views",
      "lifetime.video_views",
      "lifetime.likes",
      "lifetime.dislikes",
      "lifetime.reactions",
      "lifetime.comments_count",
      "lifetime.videos_added_to_playlist",
      "lifetime.videos_removed_from_playlist",
      "lifetime.sentiment_comments_positive_count",
      "lifetime.sentiment_comments_negative_count",
      "lifetime.sentiment_comments_neutral_count",
      "lifetime.sentiment_comments_unclassified_count",
      "lifetime.net_sentiment_score",
      "lifetime.reactions",
      "lifetime.impressions",
    ];

    // Fields to retrieve along with metrics
    const fields = [
      "created_time",
      "perma_link",
      "text",
      "internal.tags.id",
      "internal.sent_by.id",
      "internal.sent_by.email",
      "internal.sent_by.first_name",
      "internal.sent_by.last_name",
    ];

    // Create request body
    const requestData = {
      fields: fields,
      filters: [
        `customer_profile_id.eq(${profileId})`,
        `created_time.in(${startDate}T00:00:00..${endDate}T23:59:59)`,
      ],
      metrics: youtubePostMetrics,
      timezone: timezone,
      page: page,
    };

    console.log(
      "YouTube Post Metrics Request Details:",
      JSON.stringify(requestData, null, 2)
    );

    // Extract customer ID from profile ID if not provided
    const customerIdToUse =
      customerId || (profileId ? extractCustomerId(profileId) : null);

    if (!customerIdToUse) {
      throw new Error("Unable to determine customer ID");
    }

    // Use the proxy path to avoid CORS issues
    const apiUrl = `/api/proxy/posts/metrics?customerId=${customerIdToUse}`;

    console.log(`Sending POST request to ${apiUrl}`);
    const response = await axios.post(apiUrl, requestData);
    console.log(response);
    if (!response) {
      throw new Error("No response received from API");
    }

    if (!response.data) {
      throw new Error("Response missing data property");
    }

    const postsCount = response.data.data?.length || 0;
    console.log(`Received ${postsCount} YouTube posts with metrics`);

    if (postsCount > 0) {
      console.log("Sample post metrics:", {
        firstPost: {
          created_time: response.data.data[0].created_time,
          perma_link: response.data.data[0].perma_link,
          metrics:
            Object.keys(response.data.data[0].metrics || {}).length +
            " metrics",
        },
      });
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching YouTube post metrics data:", error);
    if (error.response) {
      // Server responded with an error status
      console.error("Server response error:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
      throw new Error(
        `API error: ${error.response.status} - ${
          error.response.data?.error || "Unknown error"
        }`
      );
    } else if (error.request) {
      // Request was made but no response received
      console.error("No response received:", error.request);
      throw new Error("No response received from server");
    } else {
      // Error in setting up the request
      throw error;
    }
  }
};
