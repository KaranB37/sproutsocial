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
      "Profile ID": dimensions.customer_profile_id,
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
      "Profile ID": dimensions.customer_profile_id,
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
      "Profile ID": dimensions.customer_profile_id,
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
  switch (networkType) {
    case "fb_instagram_account":
      return formatInstagramAnalytics;
    case "linkedin_company":
      return formatLinkedInAnalytics;
    case "fb_page":
      return formatFacebookAnalytics;
    default:
      // Default formatter for other networks
      return (response, selectedMetrics) => {
        if (!response || !response.data || !Array.isArray(response.data)) {
          return [];
        }

        return response.data.map((item) => {
          const { dimensions, metrics } = item;
          const formattedRow = {
            Date: dimensions["reporting_period.by(day)"],
            "Profile ID": dimensions.customer_profile_id,
          };

          selectedMetrics.forEach((metricId) => {
            if (metrics[metricId] !== undefined) {
              if (
                typeof metrics[metricId] === "object" &&
                metrics[metricId] !== null
              ) {
                formattedRow[metricId] = JSON.stringify(metrics[metricId]);
              } else {
                formattedRow[metricId] = metrics[metricId];
              }
            } else {
              formattedRow[metricId] = null;
            }
          });

          return formattedRow;
        });
      };
  }
};
