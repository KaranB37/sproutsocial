import {
  FACEBOOK_CALCULATED_METRICS,
  INSTAGRAM_CALCULATED_METRICS,
  LINKEDIN_CALCULATED_METRICS,
  TWITTER_CALCULATED_METRICS,
} from "@/utils/metricDefinitions";

/**
 * Format Instagram analytics data for Excel export
 * @param {Object} response - Raw API response
 * @param {Array} selectedMetrics - List of metrics to include
 * @returns {Array} Formatted data ready for Excel export
 */
export const formatInstagramAnalytics = (response, selectedMetrics) => {
  try {
    console.log("Instagram formatter received response type:", typeof response);

    // Handle different API response formats
    let dataValues = [];

    // Special case for the exact format in the provided example
    if (
      response &&
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      dataValues = response.data.data;
      console.log(
        "Using the standard API response format with data.data array"
      );
    }
    // Check for standard format (data.data array) within response directly
    else if (response.data && Array.isArray(response.data.data)) {
      dataValues = response.data.data;
      console.log("Using data.data format");
    }
    // Check if response has values array directly
    else if (response.values && Array.isArray(response.values)) {
      dataValues = response.values;
      console.log("Using direct values array from response");
    }
    // Check if response.data is an array
    else if (Array.isArray(response.data)) {
      dataValues = response.data;
      console.log("Using response.data array");
    }
    // Single object response
    else if (typeof response === "object" && response !== null) {
      // Try to extract any data we can find
      if (response.data && typeof response.data === "object") {
        dataValues = [response.data];
        console.log("Using single object response.data");
      } else {
        dataValues = [response];
        console.log("Using entire response as single data item");
      }
    }
    // No recognizable format
    else {
      console.error("Unrecognized response format:", response);
      return [];
    }

    console.log("Found dataValues array with length:", dataValues.length);

    if (dataValues.length === 0) {
      console.warn("No data values found in response");
      return [];
    }

    // Log the first item structure to help debugging
    if (dataValues.length > 0) {
      const sampleItem = dataValues[0];
      console.log(
        "Sample data item:",
        JSON.stringify(sampleItem).substring(0, 500) + "..."
      );
      console.log(
        "Sample metrics:",
        sampleItem.metrics
          ? Object.keys(sampleItem.metrics)
          : "No metrics object"
      );
      console.log("Sample follower count:", getFollowersCount(sampleItem));
    }

    // Create a list of all metrics including dependencies
    const metricsWithDependencies = new Set(selectedMetrics);

    // Add dependencies for Instagram calculated metrics
    selectedMetrics.forEach((metric) => {
      if (!metric) return; // Skip null/undefined metrics

      const calculatedMetric = INSTAGRAM_CALCULATED_METRICS.find(
        (m) => m.id === metric
      );

      if (calculatedMetric && calculatedMetric.dependsOn) {
        calculatedMetric.dependsOn.forEach((depMetric) => {
          if (depMetric) {
            // Make sure the dependency is valid
            metricsWithDependencies.add(depMetric);
            console.log(
              `Added Instagram dependency ${depMetric} for ${metric}`
            );
          }
        });
      }
    });

    console.log(
      "Final Instagram metrics with dependencies:",
      Array.from(metricsWithDependencies)
    );

    // Create the formatted data array
    return dataValues.map((item, index) => {
      // Initialize the formatted item with date and standard fields
      const formattedItem = {
        Date:
          item.end_time ||
          (item.dimensions && item.dimensions["reporting_period.by(day)"]) ||
          "Unknown",
        Network: "Instagram",
        profile_id:
          (item.dimensions && item.dimensions.customer_profile_id) ||
          item.profile_id ||
          "Unknown",
      };

      console.log(
        `Processing Instagram item ${index} with date ${formattedItem.Date}`
      );

      // First, add all base metrics from the API response
      for (const metric of metricsWithDependencies) {
        // Skip calculated metrics for now, we'll handle them next
        if (!INSTAGRAM_CALCULATED_METRICS.some((cm) => cm.id === metric)) {
          // Special case for follower count
          if (metric === "lifetime_snapshot.followers_count") {
            formattedItem[metric] = getFollowersCount(item);
            console.log(
              `Extracted follower count for Instagram item ${index}: ${formattedItem[metric]}`
            );
            continue;
          }

          // Handle nested metrics like lifetime_snapshot.followers_count
          if (metric.includes(".")) {
            const [parent, child] = metric.split(".");

            // Check in metrics object first
            if (
              item.metrics &&
              item.metrics[parent] &&
              item.metrics[parent][child] !== undefined
            ) {
              formattedItem[metric] = item.metrics[parent][child];
              console.log(
                `Found ${metric} in metrics.${parent}.${child}: ${formattedItem[metric]}`
              );
            }
            // Check if the full path is directly in metrics
            else if (item.metrics && item.metrics[metric] !== undefined) {
              formattedItem[metric] = item.metrics[metric];
              console.log(
                `Found ${metric} directly in metrics object: ${formattedItem[metric]}`
              );
            }
            // Check in item object directly
            else if (item[parent] && item[parent][child] !== undefined) {
              formattedItem[metric] = item[parent][child];
              console.log(
                `Found ${metric} in item.${parent}.${child}: ${formattedItem[metric]}`
              );
            } else {
              formattedItem[metric] = null;
              console.log(`Could not find ${metric} in item`);
            }
          } else {
            // Handle non-nested metrics
            if (item.metrics && item.metrics[metric] !== undefined) {
              formattedItem[metric] = item.metrics[metric];
              console.log(
                `Found ${metric} in metrics: ${formattedItem[metric]}`
              );
            } else if (item[metric] !== undefined) {
              formattedItem[metric] = item[metric];
              console.log(
                `Found ${metric} directly in item: ${formattedItem[metric]}`
              );
            } else {
              formattedItem[metric] = null;
              console.log(`Could not find ${metric} in item`);
            }
          }
        }
      }

      // Now calculate and add the Instagram calculated metrics
      INSTAGRAM_CALCULATED_METRICS.forEach((calculatedMetric) => {
        if (selectedMetrics.includes(calculatedMetric.id)) {
          try {
            console.log(`Calculating Instagram ${calculatedMetric.id}`);
            const result = calculatedMetric.calculate(formattedItem);
            formattedItem[calculatedMetric.id] = result;
            console.log(
              `Calculated Instagram ${calculatedMetric.id} = ${result}`
            );
          } catch (error) {
            console.error(
              `Error calculating Instagram metric ${calculatedMetric.id}:`,
              error
            );
            formattedItem[calculatedMetric.id] = null;
          }
        }
      });

      return formattedItem;
    });
  } catch (error) {
    console.error("Error formatting Instagram analytics:", error);
    console.error(error.stack);
    return [];
  }
};

/**
 * Format LinkedIn analytics data for Excel export
 * @param {Object} response - Raw API response
 * @param {Array} selectedMetrics - List of metrics to include
 * @returns {Array} Formatted data ready for Excel export
 */
export const formatLinkedInAnalytics = (response, selectedMetrics) => {
  try {
    console.log("LinkedIn formatter received response type:", typeof response);

    // Handle different API response formats
    let dataValues = [];

    // Special case for the exact format in the provided example
    if (
      response &&
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      dataValues = response.data.data;
      console.log(
        "Using the standard API response format with data.data array"
      );
    }
    // Check for standard format (data.data array) within response directly
    else if (response.data && Array.isArray(response.data.data)) {
      dataValues = response.data.data;
      console.log("Using data.data format");
    }
    // Check if response has values array directly
    else if (response.values && Array.isArray(response.values)) {
      dataValues = response.values;
      console.log("Using direct values array from response");
    }
    // Check if response.data is an array
    else if (Array.isArray(response.data)) {
      dataValues = response.data;
      console.log("Using response.data array");
    }
    // Single object response
    else if (typeof response === "object" && response !== null) {
      // Try to extract any data we can find
      if (response.data && typeof response.data === "object") {
        dataValues = [response.data];
        console.log("Using single object response.data");
      } else {
        dataValues = [response];
        console.log("Using entire response as single data item");
      }
    }
    // No recognizable format
    else {
      console.error("Unrecognized response format:", response);
      return [];
    }

    console.log("Found dataValues array with length:", dataValues.length);

    if (dataValues.length === 0) {
      console.warn("No data values found in response");
      return [];
    }

    // Log the first item structure to help debugging
    if (dataValues.length > 0) {
      const sampleItem = dataValues[0];
      console.log(
        "Sample data item:",
        JSON.stringify(sampleItem).substring(0, 500) + "..."
      );
      console.log(
        "Sample metrics:",
        sampleItem.metrics
          ? Object.keys(sampleItem.metrics)
          : "No metrics object"
      );
      console.log("Sample follower count:", getFollowersCount(sampleItem));
    }

    // Create a list of all metrics including dependencies
    const metricsWithDependencies = new Set(selectedMetrics);

    // Add dependencies for LinkedIn calculated metrics
    selectedMetrics.forEach((metric) => {
      if (!metric) return; // Skip null/undefined metrics

      const calculatedMetric = LINKEDIN_CALCULATED_METRICS.find(
        (m) => m.id === metric
      );

      if (calculatedMetric && calculatedMetric.dependsOn) {
        calculatedMetric.dependsOn.forEach((depMetric) => {
          if (depMetric) {
            // Make sure the dependency is valid
            metricsWithDependencies.add(depMetric);
            console.log(`Added LinkedIn dependency ${depMetric} for ${metric}`);
          }
        });
      }
    });

    console.log(
      "Final LinkedIn metrics with dependencies:",
      Array.from(metricsWithDependencies)
    );

    // Create the formatted data array
    return dataValues.map((item, index) => {
      // Initialize the formatted item with date and standard fields
      const formattedItem = {
        Date:
          item.end_time ||
          (item.dimensions && item.dimensions["reporting_period.by(day)"]) ||
          "Unknown",
        Network: "LinkedIn",
        profile_id:
          (item.dimensions && item.dimensions.customer_profile_id) ||
          item.profile_id ||
          "Unknown",
      };

      console.log(
        `Processing LinkedIn item ${index} with date ${formattedItem.Date}`
      );

      // First, add all base metrics from the API response
      for (const metric of metricsWithDependencies) {
        // Skip calculated metrics for now, we'll handle them next
        if (!LINKEDIN_CALCULATED_METRICS.some((cm) => cm.id === metric)) {
          // Special case for follower count
          if (metric === "lifetime_snapshot.followers_count") {
            formattedItem[metric] = getFollowersCount(item);
            console.log(
              `Extracted follower count for LinkedIn item ${index}: ${formattedItem[metric]}`
            );
            continue;
          }

          // Handle nested metrics like lifetime_snapshot.followers_count
          if (metric.includes(".")) {
            const [parent, child] = metric.split(".");

            // Check in metrics object first
            if (
              item.metrics &&
              item.metrics[parent] &&
              item.metrics[parent][child] !== undefined
            ) {
              formattedItem[metric] = item.metrics[parent][child];
              console.log(
                `Found ${metric} in metrics.${parent}.${child}: ${formattedItem[metric]}`
              );
            }
            // Check if the full path is directly in metrics
            else if (item.metrics && item.metrics[metric] !== undefined) {
              formattedItem[metric] = item.metrics[metric];
              console.log(
                `Found ${metric} directly in metrics object: ${formattedItem[metric]}`
              );
            }
            // Check in item object directly
            else if (item[parent] && item[parent][child] !== undefined) {
              formattedItem[metric] = item[parent][child];
              console.log(
                `Found ${metric} in item.${parent}.${child}: ${formattedItem[metric]}`
              );
            } else {
              formattedItem[metric] = null;
              console.log(`Could not find ${metric} in item`);
            }
          } else {
            // Handle non-nested metrics
            if (item.metrics && item.metrics[metric] !== undefined) {
              formattedItem[metric] = item.metrics[metric];
              console.log(
                `Found ${metric} in metrics: ${formattedItem[metric]}`
              );
            } else if (item[metric] !== undefined) {
              formattedItem[metric] = item[metric];
              console.log(
                `Found ${metric} directly in item: ${formattedItem[metric]}`
              );
            } else {
              formattedItem[metric] = null;
              console.log(`Could not find ${metric} in item`);
            }
          }
        }
      }

      // Now calculate and add the LinkedIn calculated metrics
      LINKEDIN_CALCULATED_METRICS.forEach((calculatedMetric) => {
        if (selectedMetrics.includes(calculatedMetric.id)) {
          try {
            console.log(`Calculating LinkedIn ${calculatedMetric.id}`);
            const result = calculatedMetric.calculate(formattedItem);
            formattedItem[calculatedMetric.id] = result;
            console.log(
              `Calculated LinkedIn ${calculatedMetric.id} = ${result}`
            );
          } catch (error) {
            console.error(
              `Error calculating LinkedIn metric ${calculatedMetric.id}:`,
              error
            );
            formattedItem[calculatedMetric.id] = null;
          }
        }
      });

      return formattedItem;
    });
  } catch (error) {
    console.error("Error formatting LinkedIn analytics:", error);
    console.error(error.stack);
    return [];
  }
};

// Special handling to ensure followers_count is properly extracted from the API response
const getFollowersCount = (item) => {
  // Try all possible locations where follower count might be stored
  if (
    item.metrics &&
    item.metrics["lifetime_snapshot.followers_count"] !== undefined
  ) {
    return item.metrics["lifetime_snapshot.followers_count"];
  }
  if (
    item.metrics &&
    item.metrics.lifetime_snapshot &&
    item.metrics.lifetime_snapshot.followers_count !== undefined
  ) {
    return item.metrics.lifetime_snapshot.followers_count;
  }
  if (
    item.lifetime_snapshot &&
    item.lifetime_snapshot.followers_count !== undefined
  ) {
    return item.lifetime_snapshot.followers_count;
  }
  return null;
};

/**
 * Format Facebook analytics data for Excel export
 * @param {Object} response - Raw API response
 * @param {Array} selectedMetrics - List of metrics to include
 * @returns {Array} Formatted data ready for Excel export
 */
export const formatFacebookAnalytics = (response, selectedMetrics) => {
  try {
    console.log("Facebook formatter received response type:", typeof response);

    // Handle different API response formats
    let dataValues = [];

    // Special case for the exact format in the provided example
    if (
      response &&
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      dataValues = response.data.data;
      console.log(
        "Using the standard API response format with data.data array"
      );
    }
    // Check for standard format (data.data array) within response directly
    else if (response.data && Array.isArray(response.data.data)) {
      dataValues = response.data.data;
      console.log("Using data.data format");
    }
    // Check if response has values array directly
    else if (response.values && Array.isArray(response.values)) {
      dataValues = response.values;
      console.log("Using direct values array from response");
    }
    // Check if response.data is an array
    else if (Array.isArray(response.data)) {
      dataValues = response.data;
      console.log("Using response.data array");
    }
    // Single object response
    else if (typeof response === "object" && response !== null) {
      // Try to extract any data we can find
      if (response.data && typeof response.data === "object") {
        dataValues = [response.data];
        console.log("Using single object response.data");
      } else {
        dataValues = [response];
        console.log("Using entire response as single data item");
      }
    }
    // No recognizable format
    else {
      console.error("Unrecognized response format:", response);
      return [];
    }

    console.log("Found dataValues array with length:", dataValues.length);

    if (dataValues.length === 0) {
      console.warn("No data values found in response");
      return [];
    }

    // Log the first item structure to help debugging
    if (dataValues.length > 0) {
      const sampleItem = dataValues[0];
      console.log(
        "Sample data item:",
        JSON.stringify(sampleItem).substring(0, 500) + "..."
      );
      console.log(
        "Sample metrics:",
        sampleItem.metrics
          ? Object.keys(sampleItem.metrics)
          : "No metrics object"
      );
      console.log("Sample follower count:", getFollowersCount(sampleItem));
    }

    // Create a list of all metrics including dependencies
    const metricsWithDependencies = new Set(selectedMetrics);

    // Only look for dependencies if we're dealing with Facebook metrics
    selectedMetrics.forEach((metric) => {
      if (!metric) return; // Skip null/undefined metrics

      const calculatedMetric = FACEBOOK_CALCULATED_METRICS.find(
        (m) => m.id === metric
      );

      if (calculatedMetric && calculatedMetric.dependsOn) {
        calculatedMetric.dependsOn.forEach((depMetric) => {
          if (depMetric) {
            // Make sure the dependency is valid
            metricsWithDependencies.add(depMetric);
            console.log(`Added dependency ${depMetric} for ${metric}`);
          }
        });
      }
    });

    console.log(
      "Final metrics with dependencies:",
      Array.from(metricsWithDependencies)
    );

    // Create the formatted data array
    return dataValues.map((item, index) => {
      // Initialize the formatted item with date and standard fields
      const formattedItem = {
        Date:
          item.end_time ||
          (item.dimensions && item.dimensions["reporting_period.by(day)"]) ||
          "Unknown",
        Network: "Facebook",
        profile_id:
          (item.dimensions && item.dimensions.customer_profile_id) ||
          item.profile_id ||
          "Unknown",
      };

      console.log(`Processing item ${index} with date ${formattedItem.Date}`);

      // First, add all base metrics from the API response
      for (const metric of metricsWithDependencies) {
        // Skip calculated metrics for now, we'll handle them next
        if (!FACEBOOK_CALCULATED_METRICS.some((cm) => cm.id === metric)) {
          // Special case for follower count
          if (metric === "lifetime_snapshot.followers_count") {
            formattedItem[metric] = getFollowersCount(item);
            console.log(
              `Extracted follower count for item ${index}: ${formattedItem[metric]}`
            );
            continue;
          }

          // Handle nested metrics like lifetime_snapshot.followers_count
          if (metric.includes(".")) {
            const [parent, child] = metric.split(".");

            // Check in metrics object first
            if (
              item.metrics &&
              item.metrics[parent] &&
              item.metrics[parent][child] !== undefined
            ) {
              formattedItem[metric] = item.metrics[parent][child];
              console.log(
                `Found ${metric} in metrics.${parent}.${child}: ${formattedItem[metric]}`
              );
            }
            // Check if the full path is directly in metrics (as in the provided example)
            else if (item.metrics && item.metrics[metric] !== undefined) {
              formattedItem[metric] = item.metrics[metric];
              console.log(
                `Found ${metric} directly in metrics object: ${formattedItem[metric]}`
              );
            }
            // Check in item object directly
            else if (item[parent] && item[parent][child] !== undefined) {
              formattedItem[metric] = item[parent][child];
              console.log(
                `Found ${metric} in item.${parent}.${child}: ${formattedItem[metric]}`
              );
            } else {
              formattedItem[metric] = null;
              console.log(`Could not find ${metric} in item`);
            }
          } else {
            // Handle non-nested metrics
            if (item.metrics && item.metrics[metric] !== undefined) {
              formattedItem[metric] = item.metrics[metric];
              console.log(
                `Found ${metric} in metrics: ${formattedItem[metric]}`
              );
            } else if (item[metric] !== undefined) {
              formattedItem[metric] = item[metric];
              console.log(
                `Found ${metric} directly in item: ${formattedItem[metric]}`
              );
            } else {
              formattedItem[metric] = null;
              console.log(`Could not find ${metric} in item`);
            }
          }
        }
      }

      // Now calculate and add the calculated metrics
      FACEBOOK_CALCULATED_METRICS.forEach((calculatedMetric) => {
        if (selectedMetrics.includes(calculatedMetric.id)) {
          try {
            console.log(`Calculating ${calculatedMetric.id}`);
            const result = calculatedMetric.calculate(formattedItem);
            formattedItem[calculatedMetric.id] = result;
            console.log(`Calculated ${calculatedMetric.id} = ${result}`);
          } catch (error) {
            console.error(
              `Error calculating metric ${calculatedMetric.id}:`,
              error
            );
            formattedItem[calculatedMetric.id] = null;
          }
        }
      });

      return formattedItem;
    });
  } catch (error) {
    console.error("Error formatting Facebook analytics:", error);
    console.error(error.stack);
    return [];
  }
};

/**
 * Format Twitter analytics data for Excel export
 * @param {Object} response - Raw API response
 * @param {Array} selectedMetrics - List of metrics to include
 * @returns {Array} Formatted data ready for Excel export
 */
export const formatTwitterAnalytics = (response, selectedMetrics) => {
  try {
    console.log("Twitter formatter received response type:", typeof response);

    // Handle different API response formats
    let dataValues = [];

    // Check for the format in the provided example: response.data is an array
    if (response && Array.isArray(response.data)) {
      dataValues = response.data;
      console.log("Using direct array from response.data");
    }
    // Check for standard format (data.data array) within response
    else if (response && response.data && Array.isArray(response.data.data)) {
      dataValues = response.data.data;
      console.log("Using standard API response format with data.data array");
    }
    // Check if response has direct data.data property
    else if (
      response.data &&
      response.data.data &&
      Array.isArray(response.data.data)
    ) {
      dataValues = response.data.data;
      console.log("Using nested data.data format");
    }
    // No recognizable format
    else {
      console.error("Unrecognized Twitter response format:", response);
      return [];
    }

    console.log("Found Twitter data array with length:", dataValues.length);

    if (dataValues.length === 0) {
      console.warn("No Twitter data values found in response");
      return [];
    }

    // Log the first item structure to help debugging
    if (dataValues.length > 0) {
      const sampleItem = dataValues[0];
      console.log(
        "Sample Twitter data item:",
        JSON.stringify(sampleItem).substring(0, 500) + "..."
      );
    }

    // Create a list of all metrics including dependencies
    const metricsWithDependencies = new Set(selectedMetrics);

    // Add dependencies for Twitter calculated metrics
    selectedMetrics.forEach((metric) => {
      if (!metric) return; // Skip null/undefined metrics

      const calculatedMetric = TWITTER_CALCULATED_METRICS.find(
        (m) => m.id === metric
      );

      if (calculatedMetric && calculatedMetric.dependsOn) {
        calculatedMetric.dependsOn.forEach((depMetric) => {
          if (depMetric) {
            // Make sure the dependency is valid
            metricsWithDependencies.add(depMetric);
            console.log(`Added Twitter dependency ${depMetric} for ${metric}`);
          }
        });
      }
    });

    console.log(
      "Final Twitter metrics with dependencies:",
      Array.from(metricsWithDependencies)
    );

    // Create the formatted data array
    const formattedData = dataValues.map((item, index) => {
      // Initialize the formatted item with standard fields
      const date =
        item.dimensions && item.dimensions["reporting_period.by(day)"]
          ? item.dimensions["reporting_period.by(day)"]
          : item.date || item.reporting_period || "Unknown";

      const profileId =
        item.dimensions && item.dimensions.customer_profile_id
          ? item.dimensions.customer_profile_id
          : item.profile_id || item.customer_profile_id || "Unknown";

      const formattedItem = {
        Date: date,
        Network: "Twitter",
        profile_id: profileId,
      };

      console.log(
        `Processing Twitter item ${index} with date ${formattedItem.Date}`
      );

      // Process all selected metrics
      metricsWithDependencies.forEach((metricId) => {
        // Skip calculated metrics - we'll handle them after collecting all base metrics
        if (TWITTER_CALCULATED_METRICS.some((m) => m.id === metricId)) {
          return;
        }

        // Special case for follower count
        if (metricId === "lifetime_snapshot.followers_count") {
          formattedItem[metricId] = getFollowersCount(item);
          console.log(
            `Extracted follower count for Twitter item ${index}: ${formattedItem[metricId]}`
          );
          return;
        }

        // Handle nested metrics like lifetime_snapshot.followers_count
        if (metricId.includes(".")) {
          const [parent, child] = metricId.split(".");

          // Check in metrics object
          if (
            item.metrics &&
            item.metrics[parent] &&
            item.metrics[parent][child] !== undefined
          ) {
            formattedItem[metricId] = item.metrics[parent][child];
            console.log(
              `Found ${metricId} in metrics.${parent}.${child}: ${formattedItem[metricId]}`
            );
          }
          // Check if the full path is directly in metrics
          else if (item.metrics && item.metrics[metricId] !== undefined) {
            formattedItem[metricId] = item.metrics[metricId];
            console.log(
              `Found ${metricId} directly in metrics object: ${formattedItem[metricId]}`
            );
          }
          // Check in item object directly
          else if (item[parent] && item[parent][child] !== undefined) {
            formattedItem[metricId] = item[parent][child];
            console.log(
              `Found ${metricId} in item.${parent}.${child}: ${formattedItem[metricId]}`
            );
          } else {
            formattedItem[metricId] = null;
            console.log(`Could not find ${metricId} in Twitter item`);
          }
        }
        // Handle non-nested metrics
        else {
          // Check if metric is in the metrics object
          if (item.metrics && item.metrics[metricId] !== undefined) {
            formattedItem[metricId] = item.metrics[metricId];
            console.log(
              `Found ${metricId} in metrics object: ${formattedItem[metricId]}`
            );
          }
          // Check if metric is directly in the item
          else if (item[metricId] !== undefined) {
            formattedItem[metricId] = item[metricId];
            console.log(
              `Found ${metricId} directly in item: ${formattedItem[metricId]}`
            );
          } else {
            formattedItem[metricId] = null;
            console.log(`Could not find ${metricId} in Twitter item`);
          }
        }

        // Convert objects to strings
        if (
          typeof formattedItem[metricId] === "object" &&
          formattedItem[metricId] !== null
        ) {
          formattedItem[metricId] = JSON.stringify(formattedItem[metricId]);
        }
      });

      // Now calculate all the Twitter calculated metrics
      TWITTER_CALCULATED_METRICS.forEach((calculatedMetric) => {
        if (selectedMetrics.includes(calculatedMetric.id)) {
          try {
            console.log(`Calculating Twitter ${calculatedMetric.id}`);
            const result = calculatedMetric.calculate(formattedItem);
            formattedItem[calculatedMetric.id] = result;
            console.log(
              `Calculated Twitter ${calculatedMetric.id} = ${result}`
            );
          } catch (error) {
            console.error(
              `Error calculating Twitter metric ${calculatedMetric.id}:`,
              error
            );
            formattedItem[calculatedMetric.id] = null;
          }
        }
      });

      return formattedItem;
    });

    console.log(
      `Twitter formatter produced ${formattedData.length} formatted rows`
    );
    return formattedData;
  } catch (error) {
    console.error("Error formatting Twitter analytics:", error);
    console.error(error.stack);
    return [];
  }
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

    // Check if the response directly includes data array (new format)
    if (Array.isArray(response.data)) {
      dataItems = response.data;
      console.log("Using direct data array from response");
    }
    // Check for standard Sprout Social API response structure
    else if (response.data.data && Array.isArray(response.data.data)) {
      dataItems = response.data.data;
      console.log("Using standard Sprout Social API data format");
    }
    // Handle single item responses
    else if (typeof response.data === "object") {
      dataItems = [response.data];
      console.log("Using single item from response.data");
    } else {
      console.warn("No recognizable data structure in response");
      return [];
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
              // Check if it's an object that needs to be stringified
              if (
                typeof item.metrics[parent][child] === "object" &&
                item.metrics[parent][child] !== null
              ) {
                formattedRow[metricId] = JSON.stringify(
                  item.metrics[parent][child]
                );
                console.log(
                  `Stringified complex object for ${metricId}:`,
                  formattedRow[metricId].substring(0, 50) + "..."
                );
              } else {
                formattedRow[metricId] = item.metrics[parent][child];
                console.log(
                  `Found nested metric ${metricId}:`,
                  formattedRow[metricId]
                );
              }
            } else {
              // Check if the full metric ID exists directly at the metrics root
              if (item.metrics[metricId] !== undefined) {
                formattedRow[metricId] = item.metrics[metricId];
                console.log(
                  `Found direct metric ${metricId}:`,
                  formattedRow[metricId]
                );
              } else {
                formattedRow[metricId] = null;
                console.log(`Metric not found: ${metricId}`);
              }
            }
          } else if (item.metrics[metricId] !== undefined) {
            formattedRow[metricId] = item.metrics[metricId];
            console.log(
              `Found standard metric ${metricId}:`,
              formattedRow[metricId]
            );
          } else {
            formattedRow[metricId] = null;
            console.log(`Metric not found: ${metricId}`);
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
            if (metricId.includes(".")) {
              // Handle nested metrics like lifetime_snapshot.followers_count
              const [parent, child] = metricId.split(".");

              if (
                point.metrics &&
                point.metrics[parent] &&
                point.metrics[parent][child] !== undefined
              ) {
                // Check if it's an object that needs to be stringified
                if (
                  typeof point.metrics[parent][child] === "object" &&
                  point.metrics[parent][child] !== null
                ) {
                  formattedRow[metricId] = JSON.stringify(
                    point.metrics[parent][child]
                  );
                } else {
                  formattedRow[metricId] = point.metrics[parent][child];
                }
              }
              // Try direct access as fallback
              else if (point.metrics && point.metrics[metricId] !== undefined) {
                formattedRow[metricId] = point.metrics[metricId];
              } else {
                formattedRow[metricId] = null;
              }
            } else if (point.metrics && point.metrics[metricId] !== undefined) {
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
          if (metricId.includes(".") && item.metrics) {
            // Handle nested metrics
            const [parent, child] = metricId.split(".");
            if (
              item.metrics[parent] &&
              item.metrics[parent][child] !== undefined
            ) {
              // Check if it's an object that needs to be stringified
              if (
                typeof item.metrics[parent][child] === "object" &&
                item.metrics[parent][child] !== null
              ) {
                formattedRow[metricId] = JSON.stringify(
                  item.metrics[parent][child]
                );
              } else {
                formattedRow[metricId] = item.metrics[parent][child];
              }
            }
            // Try direct access to metrics
            else if (item.metrics[metricId] !== undefined) {
              formattedRow[metricId] = item.metrics[metricId];
            }
            // Try accessing parent/child directly from item
            else if (item[parent] && item[parent][child] !== undefined) {
              if (
                typeof item[parent][child] === "object" &&
                item[parent][child] !== null
              ) {
                formattedRow[metricId] = JSON.stringify(item[parent][child]);
              } else {
                formattedRow[metricId] = item[parent][child];
              }
            } else {
              formattedRow[metricId] = null;
            }
          }
          // Try direct access to non-nested metrics
          else if (item[metricId] !== undefined) {
            formattedRow[metricId] = item[metricId];
          } else if (item.metrics && item.metrics[metricId] !== undefined) {
            formattedRow[metricId] = item.metrics[metricId];
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
    case "instagram":
      return formatInstagramAnalytics;
    case "linkedin_company":
    case "linkedin":
      return formatLinkedInAnalytics;
    case "fb_page":
    case "facebook": // Handle both fb_page and facebook
      return formatFacebookAnalytics;
    case "youtube":
      return (response, selectedMetrics) => {
        const formatted = genericFormatter(response, selectedMetrics);
        // Add any YouTube-specific formatting here
        return formatted;
      };
    case "twitter":
      return formatTwitterAnalytics;
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
