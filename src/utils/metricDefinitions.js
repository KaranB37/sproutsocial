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
    id: "engagement_rate",
    label: "Engagement Rate",
    isCalculated: true,
    dependsOn: ["calculated_engagements", "impressions"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      if (!metrics.impressions || metrics.impressions === 0) {
        console.log("No impressions found, returning 0");
        return 0;
      }

      // Simple division - make sure calculated_engagements is available
      const engagements = metrics.calculated_engagements || 0;
      const result = (engagements / metrics.impressions) * 100;
      console.log(`Engagement rate: ${result}%`);
      return result;
    },
  },
  {
    id: "engagement_rate_per_fan",
    label: "Engagement Rate (per fan)",
    isCalculated: true,
    dependsOn: ["calculated_engagements", "lifetime_snapshot.fans_count"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      const fansCount =
        metrics.lifetime_snapshot?.fans_count ||
        metrics?.["lifetime_snapshot.fans_count"];
      if (!fansCount || fansCount === 0) {
        console.log("No fans found, returning 0");
        return 0;
      }

      // Simple division - make sure calculated_engagements is available
      const engagements = metrics.calculated_engagements || 0;
      const result = (engagements / fansCount) * 100;
      console.log(`Engagement rate per fan: ${result}%`);
      return result;
    },
  },
  {
    id: "engagement_rate_per_reach",
    label: "Engagement Rate (per Reach)",
    isCalculated: true,
    dependsOn: ["calculated_engagements", "impressions_unique"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      if (!metrics.impressions_unique || metrics.impressions_unique === 0) {
        console.log("No unique impressions found, returning 0");
        return 0;
      }

      // Simple division - make sure calculated_engagements is available
      const engagements = metrics.calculated_engagements || 0;
      const result = (engagements / metrics.impressions_unique) * 100;
      console.log(`Engagement rate per reach: ${result}%`);
      return result;
    },
  },
  {
    id: "click_through_rate",
    label: "Click-Through Rate",
    isCalculated: true,
    dependsOn: ["post_link_clicks", "impressions"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      if (!metrics.impressions || metrics.impressions === 0) {
        console.log("No impressions found, returning 0");
        return 0;
      }

      // Simple division - make sure post_link_clicks is available
      const clicks = metrics.post_link_clicks || 0;
      const result = (clicks / metrics.impressions) * 100;
      console.log(`Click-through rate: ${result}%`);
      return result;
    },
  },
  {
    id: "net_follower_growth_percentage",
    label: "Net Follower Growth (%)",
    isCalculated: true,
    dependsOn: ["net_follower_growth", "lifetime_snapshot.followers_count"],
    calculate: (metrics) => {
      // Get the follower count at start of period (current - net growth)
      const currentFollowers = metrics.lifetime_snapshot?.followers_count || 
                               metrics?.["lifetime_snapshot.followers_count"] || 0;
      const netGrowth = metrics.net_follower_growth || 0;
      const startFollowers = currentFollowers - netGrowth;
      
      // Avoid division by zero
      if (!startFollowers || startFollowers === 0) {
        console.log("No starting followers found, returning 0");
        return 0;
      }
      
      // Calculate percentage growth
      const result = (netGrowth / startFollowers) * 100;
      console.log(`Net follower growth percentage: ${result}%`);
      return result;
    },
  },
];

/**
 * Metric definitions for Instagram calculated metrics
 */
export const INSTAGRAM_CALCULATED_METRICS = [
  {
    id: "calculated_engagements",
    label: "Engagements (Sprout's default)",
    isCalculated: true,
    dependsOn: [
      "reactions",
      "comments_count",
      "shares_count",
      "saves",
      "likes",
      "story_replies",
    ],
    calculate: (metrics) => {
      // Log the input values for debugging
      console.log("Calculating Instagram engagements with inputs:", {
        reactions: metrics.reactions,
        likes: metrics.likes,
        comments: metrics.comments_count,
        shares: metrics.shares_count,
        saves: metrics.saves,
        storyreplies: metrics.story_replies,
      });
      // Simple sum of all engagement metrics, with null/undefined safe handling
      return (
        (metrics.reactions || metrics.likes || 0) +
        (metrics.comments_count || 0) +
        (metrics.shares_count || 0) +
        (metrics.story_replies || 0) +
        (metrics.saves || 0)
      );
    },
  },
  {
    id: "engagement_rate",
    label: "Engagement Rate",
    isCalculated: true,
    dependsOn: ["calculated_engagements", "impressions"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      if (!metrics.impressions || metrics.impressions === 0) {
        console.log("No impressions found, returning 0");
        return 0;
      }

      // Simple division - make sure calculated_engagements is available
      const engagements = metrics.calculated_engagements || 0;
      const result = (engagements / metrics.impressions) * 100;
      console.log(`Instagram engagement rate: ${result}%`);
      return result;
    },
  },
  {
    id: "engagement_rate_per_follower",
    label: "Engagement Rate (per follower)",
    isCalculated: true,
    dependsOn: ["calculated_engagements", "lifetime_snapshot.followers_count"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      const followersCount =
        metrics.lifetime_snapshot?.followers_count ||
        metrics?.["lifetime_snapshot.followers_count"];
      if (!followersCount || followersCount === 0) {
        console.log("No followers found, returning 0");
        return 0;
      }

      // Simple division - make sure calculated_engagements is available
      const engagements = metrics.calculated_engagements || 0;
      const result = (engagements / followersCount) * 100;
      console.log(`Instagram engagement rate per follower: ${result}%`);
      return result;
    },
  },
  {
    id: "engagement_rate_per_reach",
    label: "Engagement Rate (per Reach)",
    isCalculated: true,
    dependsOn: ["calculated_engagements", "impressions_unique"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      if (!metrics.impressions_unique || metrics.impressions_unique === 0) {
        console.log("No unique impressions found, returning 0");
        return 0;
      }

      // Simple division - make sure calculated_engagements is available
      const engagements = metrics.calculated_engagements || 0;
      const result = (engagements / metrics.impressions_unique) * 100;
      console.log(`Instagram engagement rate per reach: ${result}%`);
      return result;
    },
  },
  {
    id: "net_follower_growth_percentage",
    label: "Net Follower Growth (%)",
    isCalculated: true,
    dependsOn: ["net_follower_growth", "lifetime_snapshot.followers_count"],
    calculate: (metrics) => {
      // Get the follower count at start of period (current - net growth)
      const currentFollowers = metrics.lifetime_snapshot?.followers_count || 
                               metrics?.["lifetime_snapshot.followers_count"] || 0;
      const netGrowth = metrics.net_follower_growth || 0;
      const startFollowers = currentFollowers - netGrowth;
      
      // Avoid division by zero
      if (!startFollowers || startFollowers === 0) {
        console.log("No starting followers found, returning 0");
        return 0;
      }
      
      // Calculate percentage growth
      const result = (netGrowth / startFollowers) * 100;
      console.log(`Instagram net follower growth percentage: ${result}%`);
      return result;
    },
  },
];

/**
 * Metric definitions for LinkedIn calculated metrics
 */
export const LINKEDIN_CALCULATED_METRICS = [
  {
    id: "calculated_engagements",
    label: "Engagements (Sprout's default)",
    isCalculated: true,
    dependsOn: [
      "reactions",
      "comments_count",
      "shares_count",
      "post_content_clicks",
    ],
    calculate: (metrics) => {
      // Log the input values for debugging
      console.log("Calculating LinkedIn engagements with inputs:", {
        reactions: metrics.reactions,
        comments: metrics.comments_count,
        shares: metrics.shares_count,
        postClicks: metrics.post_content_clicks,
      });

      // Simple sum of all engagement metrics, with null/undefined safe handling
      return (
        (metrics.reactions || 0) +
        (metrics.comments_count || 0) +
        (metrics.shares_count || 0) +
        (metrics.post_content_clicks || 0)
      );
    },
  },
  {
    id: "engagement_rate",
    label: "Engagement Rate",
    isCalculated: true,
    dependsOn: ["calculated_engagements", "impressions"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      if (!metrics.impressions || metrics.impressions === 0) {
        console.log("No impressions found, returning 0");
        return 0;
      }

      // Simple division - make sure calculated_engagements is available
      const engagements = metrics.calculated_engagements || 0;
      const result = (engagements / metrics.impressions) * 100;
      console.log(`LinkedIn engagement rate: ${result}%`);
      return result;
    },
  },
  {
    id: "engagement_rate_per_follower",
    label: "Engagement Rate (per follower)",
    isCalculated: true,
    dependsOn: ["calculated_engagements", "lifetime_snapshot.followers_count"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      const followersCount =
        metrics.lifetime_snapshot?.followers_count ||
        metrics?.["lifetime_snapshot.followers_count"];
      if (!followersCount || followersCount === 0) {
        console.log("No followers found, returning 0");
        return 0;
      }

      // Simple division - make sure calculated_engagements is available
      const engagements = metrics.calculated_engagements || 0;
      const result = (engagements / followersCount) * 100;
      console.log(`LinkedIn engagement rate per follower: ${result}%`);
      return result;
    },
  },
  {
    id: "click_through_rate",
    label: "Click-Through Rate",
    isCalculated: true,
    dependsOn: ["clicks", "impressions"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      if (!metrics.impressions || metrics.impressions === 0) {
        console.log("No impressions found, returning 0");
        return 0;
      }

      // Simple division - make sure clicks is available
      const clicks = metrics.clicks || 0;
      const result = (clicks / metrics.impressions) * 100;
      console.log(`LinkedIn click-through rate: ${result}%`);
      return result;
    },
  },
  {
    id: "net_follower_growth_percentage",
    label: "Net Follower Growth (%)",
    isCalculated: true,
    dependsOn: ["net_follower_growth", "lifetime_snapshot.followers_count"],
    calculate: (metrics) => {
      // Get the follower count at start of period (current - net growth)
      const currentFollowers = metrics.lifetime_snapshot?.followers_count || 
                               metrics?.["lifetime_snapshot.followers_count"] || 0;
      const netGrowth = metrics.net_follower_growth || 0;
      const startFollowers = currentFollowers - netGrowth;
      
      // Avoid division by zero
      if (!startFollowers || startFollowers === 0) {
        console.log("No starting followers found, returning 0");
        return 0;
      }
      
      // Calculate percentage growth
      const result = (netGrowth / startFollowers) * 100;
      console.log(`LinkedIn net follower growth percentage: ${result}%`);
      return result;
    },
  },
];

/**
 * Metric definitions for YouTube calculated metrics
 */
export const YOUTUBE_CALCULATED_METRICS = [
  {
    id: "calculated_engagements",
    label: "Engagements (Sprout's default)",
    isCalculated: true,
    dependsOn: ["likes", "comments_count", "shares_count"],
    calculate: (metrics) => {
      // Log the input values for debugging
      console.log("Calculating YouTube engagements with inputs:", {
        likes: metrics.likes,
        comments: metrics.comments_count,
        shares: metrics.shares_count,
      });

      // Simple sum of all engagement metrics, with null/undefined safe handling
      return (
        (metrics.likes || 0) +
        (metrics.comments_count || 0) +
        (metrics.shares_count || 0)
      );
    },
  },
  {
    id: "engagement_rate",
    label: "Engagement Rate (per View)",
    isCalculated: true,
    dependsOn: ["calculated_engagements", "video_views"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      if (!metrics.video_views || metrics.video_views === 0) {
        console.log("No video views found, returning 0");
        return 0;
      }

      // Simple division - make sure calculated_engagements is available
      const engagements = metrics.calculated_engagements || 0;
      const result = (engagements / metrics.video_views) * 100;
      console.log(`YouTube engagement rate per view: ${result}%`);
      return result;
    },
  },
  {
    id: "average_view_duration",
    label: "Average View Duration (minutes)",
    isCalculated: true,
    dependsOn: ["estimated_minutes_watched", "video_views"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      if (!metrics.video_views || metrics.video_views === 0) {
        console.log("No video views found, returning 0");
        return 0;
      }

      // Simple division to get average view duration in minutes
      const minutesWatched = metrics.estimated_minutes_watched || 0;
      const result = minutesWatched / metrics.video_views;
      console.log(`YouTube average view duration: ${result} minutes`);
      return result;
    },
  },
  {
    id: "net_follower_growth_percentage",
    label: "Net Subscriber Growth (%)",
    isCalculated: true,
    dependsOn: ["net_follower_growth", "lifetime_snapshot.followers_count"],
    calculate: (metrics) => {
      // Get the subscriber count at start of period (current - net growth)
      const currentFollowers = metrics.lifetime_snapshot?.followers_count || 
                               metrics?.["lifetime_snapshot.followers_count"] || 0;
      const netGrowth = metrics.net_follower_growth || 0;
      const startFollowers = currentFollowers - netGrowth;
      
      // Avoid division by zero
      if (!startFollowers || startFollowers === 0) {
        console.log("No starting subscribers found, returning 0");
        return 0;
      }
      
      // Calculate percentage growth
      const result = (netGrowth / startFollowers) * 100;
      console.log(`YouTube net subscriber growth percentage: ${result}%`);
      return result;
    },
  },
];

/**
 * Metric definitions for Twitter (X) calculated metrics
 */
export const TWITTER_CALCULATED_METRICS = [
  {
    id: "calculated_engagements",
    label: "Engagements (Sprout's default)",
    isCalculated: true,
    dependsOn: [
      "likes",
      "comments_count", // @Replies
      "shares_count", // Reposts
      "post_link_clicks",
      "post_content_clicks_other",
      "engagements_other",
    ],
    calculate: (metrics) => {
      // Log the input values for debugging
      console.log("Calculating Twitter engagements with inputs:", {
        likes: metrics.likes,
        replies: metrics.comments_count,
        reposts: metrics.shares_count,
        linkClicks: metrics.post_link_clicks,
        otherClicks: metrics.post_content_clicks_other,
        otherEngagements: metrics.engagements_other,
      });

      // Simple sum of all engagement metrics, with null/undefined safe handling
      return (
        (metrics.likes || 0) +
        (metrics.comments_count || 0) + // @Replies
        (metrics.shares_count || 0) + // Reposts
        (metrics.post_link_clicks || 0) +
        (metrics.post_content_clicks_other || 0) +
        (metrics.engagements_other || 0)
      );
    },
  },
  {
    id: "engagement_rate",
    label: "Engagement Rate",
    isCalculated: true,
    dependsOn: ["calculated_engagements", "impressions"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      if (!metrics.impressions || metrics.impressions === 0) {
        console.log("No impressions found, returning 0");
        return 0;
      }

      // Simple division - make sure calculated_engagements is available
      const engagements = metrics.calculated_engagements || 0;
      const result = (engagements / metrics.impressions) * 100;
      console.log(`Twitter engagement rate: ${result}%`);
      return result;
    },
  },
  {
    id: "engagement_rate_per_follower",
    label: "Engagement Rate (per follower)",
    isCalculated: true,
    dependsOn: ["calculated_engagements", "lifetime_snapshot.followers_count"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      const followersCount =
        metrics.lifetime_snapshot?.followers_count ||
        metrics?.["lifetime_snapshot.followers_count"];
      if (!followersCount || followersCount === 0) {
        console.log("No followers found, returning 0");
        return 0;
      }

      // Simple division - make sure calculated_engagements is available
      const engagements = metrics.calculated_engagements || 0;
      const result = (engagements / followersCount) * 100;
      console.log(`Twitter engagement rate per follower: ${result}%`);
      return result;
    },
  },
  {
    id: "click_through_rate",
    label: "Click-Through Rate",
    isCalculated: true,
    dependsOn: ["post_link_clicks", "impressions"],
    calculate: (metrics) => {
      // Make sure the denominator is valid to avoid division by zero
      if (!metrics.impressions || metrics.impressions === 0) {
        console.log("No impressions found, returning 0");
        return 0;
      }

      // Simple division - make sure post_link_clicks is available
      const clicks = metrics.post_link_clicks || 0;
      const result = (clicks / metrics.impressions) * 100;
      console.log(`Twitter click-through rate: ${result}%`);
      return result;
    },
  },
  {
    id: "net_follower_growth_percentage",
    label: "Net Follower Growth (%)",
    isCalculated: true,
    dependsOn: ["net_follower_growth", "lifetime_snapshot.followers_count"],
    calculate: (metrics) => {
      // Get the follower count at start of period (current - net growth)
      const currentFollowers = metrics.lifetime_snapshot?.followers_count || 
                               metrics?.["lifetime_snapshot.followers_count"] || 0;
      const netGrowth = metrics.net_follower_growth || 0;
      const startFollowers = currentFollowers - netGrowth;
      
      // Avoid division by zero
      if (!startFollowers || startFollowers === 0) {
        console.log("No starting followers found, returning 0");
        return 0;
      }
      
      // Calculate percentage growth
      const result = (netGrowth / startFollowers) * 100;
      console.log(`Twitter net follower growth percentage: ${result}%`);
      return result;
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
    "engagement_rate",
    "engagement_rate_per_fan",
    "engagement_rate_per_follower",
    "engagement_rate_per_reach",
    "click_through_rate",
    "net_follower_growth_percentage",
  ]);
}
