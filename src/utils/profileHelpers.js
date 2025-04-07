/**
 * Utility functions for working with social media profiles
 */

/**
 * Check if a profile is from YouTube
 * @param {Object} profile - The profile object to check
 * @returns {boolean} - True if the profile is a YouTube profile
 */
export const isYouTubeProfile = (profile) => {
  if (!profile || !profile.network_type) return false;

  return profile.network_type.toLowerCase() === "youtube";
};

/**
 * Format a profile name for display
 * @param {Object} profile - The profile object
 * @returns {string} - Formatted profile name
 */
export const formatProfileName = (profile) => {
  if (!profile) return "Unknown Profile";

  if (profile.name) return profile.name;
  if (profile.native_name) return profile.native_name;
  if (profile.customer_profile_id)
    return `Profile ${profile.customer_profile_id}`;

  return "Unnamed Profile";
};

/**
 * Extract customer ID from profile ID
 * @param {string|number} profileId - The profile ID to extract from
 * @returns {string|null} - The extracted customer ID or null if invalid
 */
export const extractCustomerId = (profileId) => {
  if (!profileId) return null;

  const profileIdStr = String(profileId);
  // The customer ID is typically the first 7 digits of the profile ID
  if (profileIdStr.length >= 7) {
    return profileIdStr.substring(0, 7);
  }

  return null;
};

/**
 * Calculate derived YouTube metrics
 * @param {Object} metrics - Raw metrics object
 * @param {boolean} isPostMetrics - Whether these are post-level metrics or channel metrics
 * @returns {Object} - Object containing derived metrics
 */
export const calculateDerivedYouTubeMetrics = (
  metrics,
  isPostMetrics = true
) => {
  if (!metrics) return {};

  // Extract base metrics with proper prefixes based on metric type
  const prefix = isPostMetrics ? "lifetime." : "";
  const subscribersGainedKey = isPostMetrics
    ? "lifetime.subscribers_gained"
    : "followers_gained";
  const likesKey = isPostMetrics ? "lifetime.likes" : "likes";
  const dislikesKey = isPostMetrics ? "lifetime.dislikes" : "dislikes";
  const commentsKey = isPostMetrics
    ? "lifetime.comments_count"
    : "comments_count";
  const sharesKey = isPostMetrics ? "lifetime.shares_count" : "shares_count";
  const videoViewsKey = isPostMetrics ? "lifetime.video_views" : "video_views";
  const annotationClicksKey = "lifetime.annotation_clicks";
  const cardClicksKey = "lifetime.card_clicks";

  // Get values or defaults
  const likes = metrics[likesKey] || 0;
  const dislikes = metrics[dislikesKey] || 0;
  const comments = metrics[commentsKey] || 0;
  const shares = metrics[sharesKey] || 0;
  const subscribersGained = metrics[subscribersGainedKey] || 0;
  const videoViews = metrics[videoViewsKey] || 0;

  // For channel metrics, annotation_clicks and card_clicks may not be available
  const annotationClicks = isPostMetrics
    ? metrics[annotationClicksKey] || 0
    : 0;
  const cardClicks = isPostMetrics ? metrics[cardClicksKey] || 0 : 0;

  // Calculate derived metrics
  const contentClickOther = annotationClicks + cardClicks;
  const videoReactions = likes + dislikes;
  const videoEngagements =
    comments +
    likes +
    dislikes +
    shares +
    subscribersGained +
    annotationClicks +
    cardClicks;
  const videoEngagementsPerView =
    videoViews > 0 ? videoEngagements / videoViews : 0;

  return {
    contentClickOther,
    videoReactions,
    videoEngagements,
    videoEngagementsPerView,
  };
};
