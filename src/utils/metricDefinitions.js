/**
 * Metric definitions for Facebook calculated metrics
 */
export const FACEBOOK_CALCULATED_METRICS = [
  {
    id: "calculated_engagements",
    label: "Engagements (Sprout's default)",
    isCalculated: true,
    dependsOn: [
      "reactions",
      "comments_count",
      "shares_count",
      "post_link_clicks",
      "post_content_clicks_other",
    ],
    calculate: (metrics) => {
      // Log the input values for debugging
      console.log("Calculating engagements with inputs:", {
        reactions: metrics.reactions,
        comments: metrics.comments_count,
        shares: metrics.shares_count,
        linkClicks: metrics.post_link_clicks,
        otherClicks: metrics.post_content_clicks_other,
      });

      // Simple sum of all engagement metrics, with null/undefined safe handling
      return (
        (metrics.reactions || 0) +
        (metrics.comments_count || 0) +
        (metrics.shares_count || 0) +
        (metrics.post_link_clicks || 0) +
        (metrics.post_content_clicks_other || 0)
      );
    },
  },
  {
    id: "engagement_rate_per_follower",
    label: "Engagement Rate (per Follower)",
    isCalculated: true,
    dependsOn: ["calculated_engagements", "lifetime_snapshot.followers_count"],
    calculate: (metrics) => {
      // Log input values for debugging
      console.log("Calculating engagement rate per follower with inputs:", {
        engagements: metrics.calculated_engagements,
        followers: metrics["lifetime_snapshot.followers_count"],
      });

      // Make sure the denominator is valid to avoid division by zero
      if (
        !metrics["lifetime_snapshot.followers_count"] ||
        metrics["lifetime_snapshot.followers_count"] === 0
      ) {
        console.log("No followers found, returning 0");
        return 0;
      }

      // Simple division - make sure calculated_engagements is available
      const engagements = metrics.calculated_engagements || 0;
      const result = engagements / metrics["lifetime_snapshot.followers_count"];
      console.log(`Engagement rate per follower: ${result}`);
      return result;
    },
  },
  {
    id: "engagement_rate_per_impression",
    label: "Engagement Rate (per Impression)",
    isCalculated: true,
    dependsOn: ["calculated_engagements", "impressions"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      if (!metrics.impressions || metrics.impressions === 0) return 0;

      // Simple division - make sure calculated_engagements is available
      const engagements = metrics.calculated_engagements || 0;
      return engagements / metrics.impressions;
    },
  },
  {
    id: "engagement_rate_per_reach",
    label: "Engagement Rate (per Reach)",
    isCalculated: true,
    dependsOn: ["calculated_engagements", "impressions_unique"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      if (!metrics.impressions_unique || metrics.impressions_unique === 0)
        return 0;

      // Simple division - make sure calculated_engagements is available
      const engagements = metrics.calculated_engagements || 0;
      return engagements / metrics.impressions_unique;
    },
  },
  {
    id: "click_through_rate",
    label: "Click-Through Rate",
    isCalculated: true,
    dependsOn: ["post_link_clicks", "impressions"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      if (!metrics.impressions || metrics.impressions === 0) return 0;

      // Simple division - make sure post_link_clicks is available
      const clicks = metrics.post_link_clicks || 0;
      return clicks / metrics.impressions;
    },
  },
];

/**
 * Helper function to get all dependency metric IDs for a given set of calculated metrics
 * @param {Array} selectedMetricIds - Array of selected metric IDs
 * @param {Array} calculatedMetricDefinitions - Array of metric definition objects
 * @returns {Set} Set of all required metric IDs including dependencies
 */
export function getAllRequiredMetricIds(
  selectedMetricIds,
  calculatedMetricDefinitions
) {
  const requiredMetrics = new Set([...selectedMetricIds]);

  // For each selected metric that is calculated, include all its dependencies
  selectedMetricIds.forEach((metricId) => {
    const metricDef = calculatedMetricDefinitions.find(
      (m) => m.id === metricId
    );
    if (metricDef && metricDef.isCalculated && metricDef.dependsOn) {
      metricDef.dependsOn.forEach((dependency) => {
        requiredMetrics.add(dependency);

        // Check if this dependency is itself a calculated metric
        const depMetricDef = calculatedMetricDefinitions.find(
          (m) => m.id === dependency
        );
        if (
          depMetricDef &&
          depMetricDef.isCalculated &&
          depMetricDef.dependsOn
        ) {
          // Recursively add dependencies of dependencies
          depMetricDef.dependsOn.forEach((subDep) =>
            requiredMetrics.add(subDep)
          );
        }
      });
    }
  });

  return requiredMetrics;
}

/**
 * Helper function to filter out calculated metrics
 * @param {Array} metricIds - Array of metric IDs
 * @param {Array} calculatedMetricDefinitions - Array of metric definition objects
 * @returns {Array} Array of metric IDs that aren't calculated
 */
export function filterOutCalculatedMetrics(
  metricIds,
  calculatedMetricDefinitions
) {
  return metricIds.filter((metricId) => {
    const metricDef = calculatedMetricDefinitions.find(
      (m) => m.id === metricId
    );
    return !(metricDef && metricDef.isCalculated);
  });
}

/**
 * Helper function to identify metrics that should be formatted as percentages
 * @returns {Set} Set of metric IDs that should be formatted as percentages
 */
export function getPercentageFormattedMetrics() {
  return new Set([
    "engagement_rate_per_follower",
    "engagement_rate_per_impression",
    "engagement_rate_per_reach",
    "click_through_rate",
  ]);
}
