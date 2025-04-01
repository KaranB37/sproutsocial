/**
 * Format Instagram analytics data for Excel export
 * @param {Object} response - Raw API response
 * @param {Array} selectedMetrics - List of metrics to include
 * @returns {Array} Formatted data ready for Excel export
 */
export const formatInstagramAnalytics = (response, selectedMetrics) => {
  if (!response || !response.data || !Array.isArray(response.data)) {
    return [];
  }

  return response.data.map((item) => {
    const { dimensions, metrics } = item;
    const formattedRow = {
      // Always include these dimension fields
      Date: dimensions["reporting_period.by(day)"],
      Network: "Instagram",
    };

    // Add selected metrics
    selectedMetrics.forEach((metricId) => {
      if (metricId.includes(".")) {
        // Handle nested metrics like lifetime_snapshot.followers_count
        const [parent, child] = metricId.split(".");
        if (metrics[parent] && metrics[parent][child] !== undefined) {
          // For complex objects like followers_by_country, stringify them
          if (
            typeof metrics[parent][child] === "object" &&
            metrics[parent][child] !== null
          ) {
            formattedRow[metricId] = JSON.stringify(metrics[parent][child]);
          } else {
            formattedRow[metricId] = metrics[parent][child];
          }
        } else {
          formattedRow[metricId] = null;
        }
      } else if (
        metricId === "posts_sent_by_content_type" ||
        metricId === "posts_sent_by_post_type"
      ) {
        // Handle special case for post type objects
        if (metrics[metricId] && typeof metrics[metricId] === "object") {
          formattedRow[metricId] = JSON.stringify(metrics[metricId]);
        } else {
          formattedRow[metricId] = null;
        }
      } else {
        // Handle regular metrics
        formattedRow[metricId] =
          metrics[metricId] !== undefined ? metrics[metricId] : null;
      }
    });

    return formattedRow;
  });
};

/**
 * Format LinkedIn analytics data for Excel export
 * @param {Object} response - Raw API response
 * @param {Array} selectedMetrics - List of metrics to include
 * @returns {Array} Formatted data ready for Excel export
 */
export const formatLinkedInAnalytics = (response, selectedMetrics) => {
  if (!response || !response.data || !Array.isArray(response.data)) {
    return [];
  }

  return response.data.map((item) => {
    const { dimensions, metrics } = item;
    const formattedRow = {
      Date: dimensions["reporting_period.by(day)"],
      Network: "LinkedIn",
    };

    selectedMetrics.forEach((metricId) => {
      if (metricId.includes(".")) {
        // Handle nested metrics like lifetime_snapshot.followers_count
        const [parent, child] = metricId.split(".");
        if (metrics[parent] && metrics[parent][child] !== undefined) {
          // For complex objects like followers_by_country, stringify them
          if (
            typeof metrics[parent][child] === "object" &&
            metrics[parent][child] !== null
          ) {
            formattedRow[metricId] = JSON.stringify(metrics[parent][child]);
          } else {
            formattedRow[metricId] = metrics[parent][child];
          }
        } else {
          formattedRow[metricId] = null;
        }
      } else if (
        metricId === "followers_by_job_function" ||
        metricId === "followers_by_seniority" ||
        metricId === "posts_sent_by_content_type" ||
        metricId === "posts_sent_by_post_type"
      ) {
        // Handle special case for LinkedIn-specific objects
        if (metrics[metricId] && typeof metrics[metricId] === "object") {
          formattedRow[metricId] = JSON.stringify(metrics[metricId]);
        } else {
          formattedRow[metricId] = null;
        }
      } else {
        // Handle regular metrics
        formattedRow[metricId] =
          metrics[metricId] !== undefined ? metrics[metricId] : null;
      }
    });

    return formattedRow;
  });
};

/**
 * Format Facebook analytics data for Excel export
 * @param {Object} response - Raw API response
 * @param {Array} selectedMetrics - List of metrics to include
 * @returns {Array} Formatted data ready for Excel export
 */
export const formatFacebookAnalytics = (response, selectedMetrics) => {
  if (!response || !response.data || !Array.isArray(response.data)) {
    return [];
  }

  return response.data.map((item) => {
    const { dimensions, metrics } = item;
    const formattedRow = {
      Date: dimensions["reporting_period.by(day)"],
      Network: "Facebook",
    };

    selectedMetrics.forEach((metricId) => {
      if (metricId.includes(".")) {
        const [parent, child] = metricId.split(".");
        if (metrics[parent] && metrics[parent][child] !== undefined) {
          if (
            typeof metrics[parent][child] === "object" &&
            metrics[parent][child] !== null
          ) {
            formattedRow[metricId] = JSON.stringify(metrics[parent][child]);
          } else {
            formattedRow[metricId] = metrics[parent][child];
          }
        } else {
          formattedRow[metricId] = null;
        }
      } else {
        formattedRow[metricId] =
          metrics[metricId] !== undefined ? metrics[metricId] : null;
      }
    });

    return formattedRow;
  });
};

/**
 * Get the appropriate formatter based on network type
 * @param {string} networkType - The type of network (instagram, linkedin, facebook, etc.)
 * @returns {Function} The formatter function for the specified network
 */
export const getNetworkFormatter = (networkType) => {
  // Network display name mapping
  const NETWORK_DISPLAY_NAMES = {
    fb_instagram_account: "Instagram",
    linkedin_company: "LinkedIn",
    fb_page: "Facebook",
    threads: "Threads",
    tiktok: "TikTok",
    youtube: "YouTube",
    twitter: "Twitter",
  };

  // Get friendly display name for the network
  const getNetworkDisplayName = (type) => {
    return NETWORK_DISPLAY_NAMES[type] || type.replace(/_/g, " ").toUpperCase();
  };

  // Generic formatter that includes username and profile link
  const genericFormatter = (response, selectedMetrics) => {
    // Log basic info but not the full response
    console.log(
      `Formatter received ${
        response?.data?.data?.length || 0
      } data items with ${selectedMetrics.length} metrics`
    );

    if (!response || !response.data) {
      console.error("Invalid response format - missing data", response);
      return [];
    }

    // Handle different response formats
    let dataItems = [];

    // Check for the expected structure from Sprout Social API
    if (response.data.data && Array.isArray(response.data.data)) {
      dataItems = response.data.data;
    }
    // Fallback for other response formats
    else if (Array.isArray(response.data)) {
      dataItems = response.data;
    }
    // Handle single item responses
    else if (typeof response.data === "object") {
      dataItems = [response.data];
    }

    if (dataItems.length === 0) {
      console.warn("No data items found in response");
      return [];
    }

    // Create the formatted data rows
    const formattedData = dataItems.flatMap((item) => {
      // Handle different item formats

      // Case 1: Sprout Social API format with dimensions and metrics
      if (item.dimensions && item.metrics) {
        const profileId = item.dimensions.customer_profile_id || "unknown";
        let date = "N/A";

        // Try to extract date from different possible dimension keys
        const dateKeys = [
          "reporting_period.by(day)",
          "reporting_period",
          "date",
        ];

        for (const key of dateKeys) {
          if (item.dimensions[key]) {
            date = item.dimensions[key];
            break;
          }
        }

        // Create the base row
        const formattedRow = {
          Date: date,
          Network: getNetworkDisplayName(networkType),
          profile_id: profileId,
        };

        // Add each selected metric
        selectedMetrics.forEach((metricId) => {
          if (metricId.includes(".")) {
            // Handle nested metrics like lifetime_snapshot.followers_count
            const [parent, child] = metricId.split(".");
            if (
              item.metrics[parent] &&
              item.metrics[parent][child] !== undefined
            ) {
              formattedRow[metricId] = item.metrics[parent][child];
            } else {
              formattedRow[metricId] = null;
            }
          } else if (item.metrics[metricId] !== undefined) {
            formattedRow[metricId] = item.metrics[metricId];
          } else {
            formattedRow[metricId] = null;
          }
        });

        return formattedRow;
      }

      // Case 2: Format with data_points array
      else if (item.data_points && Array.isArray(item.data_points)) {
        const profileId = item.profile_id || "unknown";

        return item.data_points.map((point) => {
          const formattedRow = {
            Date: point.date || "N/A",
            Network: point.network || getNetworkDisplayName(networkType),
            profile_id: profileId,
          };

          selectedMetrics.forEach((metricId) => {
            if (point.metrics && point.metrics[metricId] !== undefined) {
              formattedRow[metricId] = point.metrics[metricId];
            } else {
              formattedRow[metricId] = null;
            }
          });

          return formattedRow;
        });
      }

      // Case 3: Simple flat format
      else {
        const formattedRow = {
          Date: item.date || item.reporting_period || "N/A",
          Network: item.network || getNetworkDisplayName(networkType),
          profile_id: item.profile_id || item.customer_profile_id || "unknown",
        };

        selectedMetrics.forEach((metricId) => {
          // Try to find the metric in different possible locations
          if (item[metricId] !== undefined) {
            formattedRow[metricId] = item[metricId];
          } else if (item.metrics && item.metrics[metricId] !== undefined) {
            formattedRow[metricId] = item.metrics[metricId];
          } else if (metricId.includes(".") && item.metrics) {
            // Handle nested metrics
            const [parent, child] = metricId.split(".");
            if (
              item.metrics[parent] &&
              item.metrics[parent][child] !== undefined
            ) {
              formattedRow[metricId] = item.metrics[parent][child];
            } else {
              formattedRow[metricId] = null;
            }
          } else {
            formattedRow[metricId] = null;
          }
        });

        return formattedRow;
      }
    });

    console.log(`Formatter produced ${formattedData.length} formatted rows`);
    return formattedData;
  };

  // Use specific formatters for certain networks, or fall back to generic
  switch (networkType) {
    case "fb_instagram_account":
      return (response, selectedMetrics) => {
        const formatted = genericFormatter(response, selectedMetrics);
        // Add any Instagram-specific formatting here
        return formatted;
      };
    case "linkedin_company":
      return (response, selectedMetrics) => {
        const formatted = genericFormatter(response, selectedMetrics);
        // Add any LinkedIn-specific formatting here
        return formatted;
      };
    case "fb_page":
    case "facebook": // Handle both fb_page and facebook
      return (response, selectedMetrics) => {
        const formatted = genericFormatter(response, selectedMetrics);
        // Add any Facebook-specific formatting here
        return formatted;
      };
    case "youtube":
      return (response, selectedMetrics) => {
        const formatted = genericFormatter(response, selectedMetrics);
        // Add any YouTube-specific formatting here
        return formatted;
      };
    case "twitter":
      return (response, selectedMetrics) => {
        const formatted = genericFormatter(response, selectedMetrics);
        // Add any Twitter-specific formatting here
        return formatted;
      };
    case "threads":
      return (response, selectedMetrics) => {
        const formatted = genericFormatter(response, selectedMetrics);
        // Add any Threads-specific formatting here
        return formatted;
      };
    case "tiktok":
      return (response, selectedMetrics) => {
        const formatted = genericFormatter(response, selectedMetrics);
        // Add any TikTok-specific formatting here
        return formatted;
      };
    default:
      return genericFormatter;
  }
};
