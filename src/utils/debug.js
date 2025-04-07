/**
 * Debug utilities for development
 */

import { isYouTubeProfile } from "./profileHelpers";

/**
 * Log detailed information about profiles
 * @param {Array} profiles - Array of profile objects
 */
export const logProfilesInfo = (profiles) => {
  if (!profiles || !Array.isArray(profiles)) {
    console.log("No profiles or invalid profiles data");
    return;
  }

  console.log(`Total profiles: ${profiles.length}`);

  // Count profiles by network type
  const networkCounts = profiles.reduce((counts, profile) => {
    const networkType = profile.network_type?.toLowerCase() || "unknown";
    counts[networkType] = (counts[networkType] || 0) + 1;
    return counts;
  }, {});

  console.log("Network counts:", networkCounts);

  // Log YouTube profiles
  const youtubeProfiles = profiles.filter(isYouTubeProfile);
  console.log(`Found ${youtubeProfiles.length} YouTube profiles`);

  youtubeProfiles.forEach((profile) => {
    console.log(
      `YouTube profile: ${
        profile.name || profile.native_name || "Unnamed"
      } (ID: ${profile.customer_profile_id})`
    );
  });
};

/**
 * Log information about API errors
 * @param {Error} error - Error object
 * @param {string} context - Context where the error occurred
 */
export const logApiError = (error, context = "API") => {
  console.error(`${context} Error:`, error.message);

  if (error.response) {
    // Server responded with error
    console.error(`${context} Response:`, {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
    });
  } else if (error.request) {
    // Request made but no response
    console.error(`${context} Request made but no response received`);
  } else {
    // Error in setting up request
    console.error(`${context} Request setup error:`, error);
  }
};
