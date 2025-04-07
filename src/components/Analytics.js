import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { getProfileAnalytics } from "@/api/analytics";
import { getNetworkFormatter } from "@/utils/analyticsFormatters";
import { groupDataByReportingPeriod } from "@/utils/reportingPeriodUtils";
import {
  getAllRequiredMetricIds,
  filterOutCalculatedMetrics,
  getPercentageFormattedMetrics,
} from "@/utils/metricDefinitions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, isValid } from "date-fns";
import { CalendarIcon, BarChart3, Loader2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";
import {
  formatFacebookAnalytics,
  formatTwitterAnalytics,
  formatInstagramAnalytics,
  formatLinkedInAnalytics,
} from "@/utils/analyticsFormatters";
import {
  FACEBOOK_CALCULATED_METRICS,
  INSTAGRAM_CALCULATED_METRICS,
  LINKEDIN_CALCULATED_METRICS,
  TWITTER_CALCULATED_METRICS,
  YOUTUBE_CALCULATED_METRICS,
} from "@/utils/metricDefinitions";

// Define export format options
const EXPORT_FORMATS = [
  { id: "daily", label: "Daily" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly (FY)" },
  { id: "yearly", label: "Yearly (FY)" },
];

// Network display name mapping - remove the duplicate Facebook entry
const NETWORK_DISPLAY_NAMES = {
  fb_instagram_account: "Instagram",
  linkedin_company: "LinkedIn",
  fb_page: "Facebook",
  facebook: "Facebook",
  threads: "Threads",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "Twitter",
};

// Updated comprehensive network metrics based on Sprout Social API
const NETWORK_METRICS = {
  facebook: [
    { id: "lifetime_snapshot.followers_count", label: "Followers" },
    { id: "net_follower_growth", label: "Net Follower Growth" },
    { id: "followers_gained", label: "Followers Gained" },
    { id: "followers_gained_organic", label: "Organic Followers Gained" },
    { id: "followers_gained_paid", label: "Paid Followers Gained" },
    { id: "followers_lost", label: "Page Unlikes" },
    { id: "lifetime_snapshot.fans_count", label: "Fans" },
    { id: "fans_gained", label: "Page Likes" },
    { id: "fans_gained_organic", label: "Organic Page Likes" },
    { id: "fans_gained_paid", label: "Paid Page Likes" },
    { id: "fans_lost", label: "Page Unlikes" },
    { id: "impressions", label: "Impressions" },
    { id: "impressions_organic", label: "Organic Impressions" },
    { id: "impressions_viral", label: "Viral Impressions" },
    { id: "impressions_nonviral", label: "Non-viral Impressions" },
    { id: "impressions_paid", label: "Paid Impressions" },
    { id: "tab_views", label: "Page Tab Views" },
    { id: "tab_views_login", label: "Logged In Page Tab Views" },
    { id: "tab_views_logout", label: "Logged Out Page Tab Views" },
    { id: "post_impressions", label: "Post Impressions" },
    { id: "post_impressions_organic", label: "Organic Post Impressions" },
    { id: "post_impressions_viral", label: "Viral Post Impressions" },
    { id: "post_impressions_nonviral", label: "Non-viral Post Impressions" },
    { id: "post_impressions_paid", label: "Paid Post Impressions" },
    { id: "impressions_unique", label: "Reach" },
    { id: "impressions_organic_unique", label: "Organic Reach" },
    { id: "impressions_viral_unique", label: "Viral Reach" },
    { id: "impressions_nonviral_unique", label: "Non-viral Reach" },
    { id: "impressions_paid_unique", label: "Paid Reach" },
    { id: "reactions", label: "Reactions" },
    { id: "comments_count", label: "Comments" },
    { id: "shares_count", label: "Shares" },
    { id: "post_link_clicks", label: "Post Link Clicks" },
    { id: "post_content_clicks_other", label: "Other Post Clicks" },
    { id: "profile_actions", label: "Page Actions" },
    { id: "post_engagements", label: "Post Engagements" },
    { id: "video_views", label: "Video Views" },
    { id: "video_views_organic", label: "Organic Video Views" },
    { id: "video_views_paid", label: "Paid Video Views" },
    { id: "video_views_autoplay", label: "Autoplay Video Views" },
    { id: "video_views_click_to_play", label: "Click to Play Video Views" },
    { id: "video_views_repeat", label: "Replayed Video Views" },
    { id: "video_view_time", label: "Video View Time" },
    { id: "video_views_unique", label: "Unique Video Views" },
    { id: "video_views_30s_complete", label: "Full Video Views" },
    {
      id: "video_views_30s_complete_organic",
      label: "Organic Full Video Views",
    },
    { id: "video_views_30s_complete_paid", label: "Paid Full Video Views" },
    {
      id: "video_views_30s_complete_autoplay",
      label: "Autoplay Full Video Views",
    },
    {
      id: "video_views_30s_complete_click_to_play",
      label: "Click to Play Full Video Views",
    },
    {
      id: "video_views_30s_complete_repeat",
      label: "Replayed Full Video Views",
    },
    { id: "video_views_30s_complete_unique", label: "Unique Full Video Views" },
    { id: "video_views_partial", label: "Partial Video Views" },
    { id: "video_views_partial_organic", label: "Organic Partial Video Views" },
    { id: "video_views_partial_paid", label: "Paid Partial Video Views" },
    {
      id: "video_views_partial_autoplay",
      label: "Autoplay Partial Video Views",
    },
    {
      id: "video_views_partial_click_to_play",
      label: "Click to Play Partial Video Views",
    },
    { id: "video_views_partial_repeat", label: "Replayed Partial Video Views" },
    { id: "posts_sent_count", label: "Posts Sent Count" },
    ...FACEBOOK_CALCULATED_METRICS,
  ],
  fb_instagram_account: [
    { id: "lifetime_snapshot.followers_count", label: "Followers" },
    { id: "net_follower_growth", label: "Net Follower Growth" },
    { id: "followers_gained", label: "Followers Gained" },
    { id: "followers_lost", label: "Followers Lost" },
    { id: "lifetime_snapshot.following_count", label: "Following" },
    { id: "net_following_growth", label: "Net Following Growth" },
    { id: "impressions", label: "Impressions" },
    { id: "impressions_unique", label: "Reach" },
    { id: "video_views", label: "Post Video Views" },
    { id: "reactions", label: "Reactions" },
    { id: "likes", label: "Likes" },
    { id: "comments_count", label: "Comments" },
    { id: "saves", label: "Saves" },
    { id: "shares_count", label: "Shares" },
    { id: "story_replies", label: "Story Replies" },
    { id: "posts_sent_count", label: "Posts Sent Count" },
    ...INSTAGRAM_CALCULATED_METRICS,
  ],
  linkedin_company: [
    { id: "lifetime_snapshot.followers_count", label: "Followers" },
    { id: "followers_by_job_function", label: "Followers By Job" },
    { id: "followers_by_seniority", label: "Followers By Seniority" },
    { id: "net_follower_growth", label: "Net Follower Growth" },
    { id: "followers_gained", label: "Followers Gained" },
    { id: "followers_gained_organic", label: "Organic Followers Gained" },
    { id: "followers_gained_paid", label: "Paid Followers Gained" },
    { id: "followers_lost", label: "Followers Lost" },
    { id: "impressions", label: "Impressions" },
    { id: "impressions_unique", label: "Reach" },
    { id: "engagement", label: "Engagement" },
    { id: "clicks", label: "Clicks" },
    { id: "reactions", label: "Reactions" },
    { id: "comments_count", label: "Comments" },
    { id: "shares_count", label: "Shares" },
    { id: "post_content_clicks", label: "Post Clicks (All)" },
    { id: "posts_sent_count", label: "Posts Sent Count" },
    ...LINKEDIN_CALCULATED_METRICS,
  ],

  youtube: [
    { id: "lifetime_snapshot.followers_count", label: "Subscribers" },
    { id: "net_follower_growth", label: "Net Subscriber Growth" },
    { id: "followers_gained", label: "Subscribers Gained" },
    { id: "followers_lost", label: "Subscribers Lost" },
    { id: "posts_sent_count", label: "Posts Sent" },
    { id: "likes", label: "Likes" },
    { id: "video_views", label: "Video Views" },
    ...YOUTUBE_CALCULATED_METRICS,
  ],

  twitter: [
    { id: "lifetime_snapshot.followers_count", label: "Followers" },
    { id: "net_follower_growth", label: "Net Follower Growth" },
    { id: "followers_gained", label: "Followers Gained" },
    { id: "followers_lost", label: "Followers Lost" },
    { id: "impressions", label: "Impressions" },
    { id: "post_media_views", label: "Media Views" },
    { id: "video_views", label: "Video Views" },
    { id: "reactions", label: "Reactions" },
    { id: "likes", label: "Likes" },
    { id: "comments_count", label: "Replies" },
    { id: "shares_count", label: "Reposts" },
    { id: "post_content_clicks", label: "Post Clicks (All)" },
    { id: "post_link_clicks", label: "Post Link Clicks" },
    { id: "post_content_clicks_other", label: "Other Post Clicks" },
    { id: "post_media_clicks", label: "Post Media Clicks" },
    { id: "post_hashtag_clicks", label: "Post Hashtag Clicks" },
    { id: "post_detail_expand_clicks", label: "Post Detail Expand Clicks" },
    { id: "post_profile_clicks", label: "Profile Clicks" },
    { id: "engagements_other", label: "Other Engagements" },
    { id: "post_app_engagements", label: "App Engagements" },
    { id: "post_app_installs", label: "App Install Attempts" },
    { id: "post_app_opens", label: "App Opens" },
    { id: "posts_sent_count", label: "Posts Sent Count" },
    ...TWITTER_CALCULATED_METRICS,
  ],
  tiktok: [
    { id: "lifetime_snapshot.followers_count", label: "Followers" },
    { id: "net_follower_growth", label: "Net Follower Growth" },
    { id: "followers_gained", label: "Followers Gained" },
    { id: "followers_lost", label: "Followers Lost" },
    { id: "video_views", label: "Video Views" },
    { id: "profile_views", label: "Profile Views" },
    { id: "likes", label: "Likes" },
    { id: "comments", label: "Comments" },
    { id: "shares", label: "Shares" },
    { id: "posts_sent_count", label: "Videos Published" },
  ],
  threads: [{ id: "lifetime_snapshot.followers_count", label: "Followers" }],
};

// Network display order
const NETWORK_DISPLAY_ORDER = [
  "fb_instagram_account",
  "linkedin_company",
  "facebook",
  "threads",
  "youtube",
  "twitter",
  "tiktok",
];

// URL path for YouTube post metrics
const YOUTUBE_POST_METRICS_PATH = "/youtube-post-metrics";

const Analytics = ({ profiles, customerId }) => {
  // State for form inputs
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedNetworkType, setSelectedNetworkType] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [selectedMetricsByNetwork, setSelectedMetricsByNetwork] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfigPanel, setShowConfigPanel] = useState(true);
  const [selectedNetworks, setSelectedNetworks] = useState([]);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [exportFormat, setExportFormat] = useState("daily");
  // Store profiles data for reference
  const [profilesMap, setProfilesMap] = useState({});
  // Search functionality - one search term per network type
  const [searchTerms, setSearchTerms] = useState({});
  const [searchResults, setSearchResults] = useState({});
  // Add state for selected year
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Add state for YouTube metrics modal
  const [showYoutubeMetricsModal, setShowYoutubeMetricsModal] = useState(false);

  // Initialize profilesMap when profiles data is available
  useEffect(() => {
    if (profiles && profiles.length > 0) {
      const profilesById = {};
      profiles.forEach((profile) => {
        profilesById[profile.customer_profile_id] = profile;
      });
      setProfilesMap(profilesById);
    }
  }, [profiles]);

  // Sort and filter profiles when search terms change
  useEffect(() => {
    if (selectedNetworks.length > 0) {
      const filteredResults = {};

      selectedNetworks.forEach((networkType) => {
        // Get profiles for this network
        const networkProfiles = profiles.filter(
          (profile) =>
            profile.network_type === networkType ||
            (networkType === "facebook" &&
              (profile.network_type === "fb_page" ||
                profile.network_type === "facebook"))
        );

        // Sort profiles alphabetically
        const sortedProfiles = [...networkProfiles].sort((a, b) => {
          const nameA = (a.name || a.native_name || "").toLowerCase();
          const nameB = (b.name || b.native_name || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });

        // Filter by search term if one exists for this network
        const networkSearchTerm = searchTerms[networkType] || "";
        const filteredProfiles = networkSearchTerm
          ? sortedProfiles.filter((profile) => {
              const profileName = (
                profile.name ||
                profile.native_name ||
                ""
              ).toLowerCase();
              return profileName.includes(networkSearchTerm.toLowerCase());
            })
          : sortedProfiles;

        filteredResults[networkType] = filteredProfiles;
      });

      setSearchResults(filteredResults);
    }
  }, [profiles, selectedNetworks, searchTerms]);

  // Handle search input change for a specific network
  const handleSearchChange = (networkType, value) => {
    setSearchTerms((prev) => ({
      ...prev,
      [networkType]: value,
    }));
  };

  // Safe date formatting function
  const safeFormat = (date, formatStr) => {
    if (!date || !isValid(date)) return "";
    try {
      // For API calls, ensure we're using the correct format
      if (formatStr === "yyyy-MM-dd") {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
      return format(date, formatStr);
    } catch (e) {
      console.error("Date formatting error:", e);
      return "";
    }
  };

  // Filter profiles by selected network type
  const filteredProfiles = profiles.filter(
    (profile) =>
      profile.network_type === selectedNetworkType ||
      // Handle Facebook's different network types
      (selectedNetworkType === "facebook" &&
        (profile.network_type === "fb_page" ||
          profile.network_type === "facebook"))
  );

  // Handle network type selection
  const handleNetworkTypeChange = (value) => {
    setSelectedNetworkType(value);
    setSelectedProfiles([]);
    setSelectedMetricsByNetwork({});
  };

  // Handle profile selection
  const handleProfileSelection = (profileId) => {
    setSelectedProfiles((prev) => {
      if (prev.includes(profileId)) {
        return prev.filter((id) => id !== profileId);
      } else {
        return [...prev, profileId];
      }
    });
  };

  // Handle metric selection
  const handleMetricSelection = (networkType, metricId) => {
    setSelectedMetricsByNetwork((prev) => {
      // Initialize the network metrics array if it doesn't exist
      const networkMetrics = prev[networkType] || [];
      let updatedNetworkMetrics = [...networkMetrics];

      // Check if we're dealing with a network that has calculated metrics
      let metricsKey = networkType;
      if (networkType === "facebook" || networkType === "fb_page") {
        metricsKey = "facebook";
      }

      // Find the metric definition
      const metrics = NETWORK_METRICS[metricsKey] || [];
      const selectedMetric = metrics.find((metric) => metric.id === metricId);

      // Toggle the metric selection
      if (updatedNetworkMetrics.includes(metricId)) {
        // Removing the metric
        updatedNetworkMetrics = updatedNetworkMetrics.filter(
          (id) => id !== metricId
        );
      } else {
        // Adding the metric
        updatedNetworkMetrics.push(metricId);

        // If it's a calculated metric, automatically select its dependencies
        if (
          selectedMetric &&
          selectedMetric.isCalculated &&
          selectedMetric.dependsOn
        ) {
          selectedMetric.dependsOn.forEach((dependency) => {
            if (!updatedNetworkMetrics.includes(dependency)) {
              updatedNetworkMetrics.push(dependency);
            }
          });
        }
      }

      return {
        ...prev,
        [networkType]: updatedNetworkMetrics,
      };
    });
  };

  // Handle adding a network
  const handleAddNetwork = (networkType) => {
    if (!selectedNetworks.includes(networkType)) {
      setSelectedNetworks([...selectedNetworks, networkType]);
    }
    setShowNetworkSelector(false);
  };

  // Aggregate data by reporting period (daily, monthly, quarterly, yearly)
  const aggregateDataByPeriod = (data, reportingPeriod) => {
    // If daily or no data, return as is
    if (reportingPeriod === "daily" || !data || data.length === 0) {
      return data;
    }

    // Use the utility function to group data by reporting period
    // Pass start and end dates to ensure all periods in the range are included
    return groupDataByReportingPeriod(
      data,
      reportingPeriod,
      startDate,
      endDate
    );
  };

  /**
   * Generate the analytics report based on selected options
   */
  const generateReport = async (format = "json") => {
    setLoading(true);
    setError(null);

    try {
      // Get metrics for the selected network
      const selectedMetrics =
        selectedMetricsByNetwork[selectedNetworkType] || [];

      // Get the selected metrics with all dependencies for calculated metrics
      const apiMetrics = getMetricsWithDependencies(selectedMetrics);

      console.log("Fetching analytics with metrics:", apiMetrics);

      let response;

      // Make API call
      response = await getProfileAnalytics({
        customerId,
        profileId: selectedProfiles,
        startDate: safeFormat(startDate, "yyyy-MM-dd"),
        endDate: safeFormat(endDate, "yyyy-MM-dd"),
        reportingPeriod: exportFormat,
        metrics: apiMetrics,
      });

      console.log("Raw API response:", response);

      if (!response || !response.data) {
        throw new Error("Invalid response from analytics API");
      }

      if (format === "json") {
        // For JSON output, we keep the raw data from the API
        const formattedData = response.data;
        return formattedData;
      } else if (format === "excel") {
        // For Excel, format the data according to profile type
        let formattedData;

        if (
          selectedNetworkType === "facebook" ||
          selectedNetworkType === "fb_page"
        ) {
          // Pass both selected metrics and API metrics to ensure all dependencies are available
          formattedData = formatFacebookAnalytics(
            response.data,
            selectedMetrics
          );
        } else if (
          selectedNetworkType === "fb_instagram_account" ||
          selectedNetworkType === "instagram"
        ) {
          // Use Instagram formatter for Instagram profiles
          formattedData = formatInstagramAnalytics(
            response.data,
            selectedMetrics
          );
        } else if (selectedNetworkType === "twitter") {
          formattedData = formatTwitterAnalytics(
            response.data,
            selectedMetrics
          );
        } else {
          formattedData = formatLinkedInAnalytics(
            response.data,
            selectedMetrics
          );
        }

        return formattedData;
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setError(`Error generating report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add this helper function to get all required metrics including dependencies
  const getMetricsWithDependencies = (
    selectedMetrics = [],
    networkType = selectedNetworkType
  ) => {
    if (!selectedMetrics || !Array.isArray(selectedMetrics)) {
      console.warn("Invalid selectedMetrics provided:", selectedMetrics);
      return [];
    }

    const metricsWithDependencies = new Set(selectedMetrics);

    // Handle Facebook metrics
    if (networkType === "facebook" || networkType === "fb_page") {
      // Find dependencies for selected metrics from the FACEBOOK_CALCULATED_METRICS
      selectedMetrics.forEach((metricId) => {
        if (!metricId) return; // Skip null/undefined metrics

        const calculatedMetric = FACEBOOK_CALCULATED_METRICS.find(
          (m) => m.id === metricId
        );

        if (calculatedMetric && calculatedMetric.dependsOn) {
          calculatedMetric.dependsOn.forEach((depMetric) => {
            if (depMetric) {
              // Make sure the dependency is valid
              metricsWithDependencies.add(depMetric);
              console.log(
                `Added Facebook dependency ${depMetric} for ${metricId}`
              );
            }
          });
        }
      });
    }
    // Handle Instagram metrics
    else if (
      networkType === "fb_instagram_account" ||
      networkType === "instagram"
    ) {
      // Find dependencies for selected metrics from the INSTAGRAM_CALCULATED_METRICS
      selectedMetrics.forEach((metricId) => {
        if (!metricId) return; // Skip null/undefined metrics

        const calculatedMetric = INSTAGRAM_CALCULATED_METRICS.find(
          (m) => m.id === metricId
        );

        if (calculatedMetric && calculatedMetric.dependsOn) {
          calculatedMetric.dependsOn.forEach((depMetric) => {
            if (depMetric) {
              // Make sure the dependency is valid
              metricsWithDependencies.add(depMetric);
              console.log(
                `Added Instagram dependency ${depMetric} for ${metricId}`
              );
            }
          });
        }
      });
    }
    // Handle LinkedIn metrics
    else if (networkType === "linkedin_company" || networkType === "linkedin") {
      // Find dependencies for selected metrics from the LINKEDIN_CALCULATED_METRICS
      selectedMetrics.forEach((metricId) => {
        if (!metricId) return; // Skip null/undefined metrics

        const calculatedMetric = LINKEDIN_CALCULATED_METRICS.find(
          (m) => m.id === metricId
        );

        if (calculatedMetric && calculatedMetric.dependsOn) {
          calculatedMetric.dependsOn.forEach((depMetric) => {
            if (depMetric) {
              // Make sure the dependency is valid
              metricsWithDependencies.add(depMetric);
              console.log(
                `Added LinkedIn dependency ${depMetric} for ${metricId}`
              );
            }
          });
        }
      });
    }
    // Handle Twitter (X) metrics
    else if (networkType === "twitter") {
      // Find dependencies for selected metrics from the TWITTER_CALCULATED_METRICS
      selectedMetrics.forEach((metricId) => {
        if (!metricId) return; // Skip null/undefined metrics

        const calculatedMetric = TWITTER_CALCULATED_METRICS.find(
          (m) => m.id === metricId
        );

        if (calculatedMetric && calculatedMetric.dependsOn) {
          calculatedMetric.dependsOn.forEach((depMetric) => {
            if (depMetric) {
              // Make sure the dependency is valid
              metricsWithDependencies.add(depMetric);
              console.log(
                `Added Twitter dependency ${depMetric} for ${metricId}`
              );
            }
          });
        }
      });
    }

    const result = Array.from(metricsWithDependencies).filter(Boolean); // Filter out null/undefined
    console.log(`Final metrics for ${networkType}:`, result);
    return result;
  };

  /**
   * Export analytics data to Excel
   * @param {Array} data - The data to export
   */
  const exportToExcel = async (data) => {
    try {
      if (!data || data.length === 0) {
        setError("No data available to export");
        return;
      }

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Track used sheet names to prevent duplicates
      const usedSheetNames = new Set();

      // Group data by profile_id
      const profilesData = {};

      // First pass - collect all profiles
      data.forEach((row) => {
        const profileId = row.profile_id || "unknown";
        const network = row.Network || "Unknown";

        if (!profilesData[profileId]) {
          // Get profile information from profilesMap
          const foundProfile =
            profilesMap[profileId] ||
            profiles.find(
              (p) => p.customer_profile_id.toString() === profileId.toString()
            );

          // Store profile name and network info
          profilesData[profileId] = {
            network,
            profileObj: foundProfile, // Store the entire profile object for later reference
            profileName: foundProfile
              ? foundProfile.name || foundProfile.native_name || profileId
              : profileId,
            rows: [],
          };
        }

        profilesData[profileId].rows.push(row);
      });

      // Sort each profile's data by date
      Object.keys(profilesData).forEach((profileId) => {
        profilesData[profileId].rows.sort((a, b) => {
          // Sort logic remains the same
          const aDateStr = a.Date;
          const bDateStr = b.Date;

          // If date strings include FY or Q1-Q4, they're already in fiscal format
          const isFiscalFormat =
            (aDateStr && aDateStr.includes("FY")) ||
            (bDateStr && bDateStr.includes("FY"));

          if (isFiscalFormat) {
            // For fiscal formats, use string comparison
            return aDateStr.localeCompare(bDateStr);
          }

          // For month names like "January 2023"
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];

          // Check if both dates use month name format
          const aMonthFormat = monthNames.some(
            (month) => aDateStr && aDateStr.includes(month)
          );
          const bMonthFormat = monthNames.some(
            (month) => bDateStr && bDateStr.includes(month)
          );

          if (aMonthFormat && bMonthFormat) {
            // Extract year and month for comparison
            const aYear = parseInt(aDateStr.match(/\d{4}/)?.[0] || "0");
            const bYear = parseInt(bDateStr.match(/\d{4}/)?.[0] || "0");

            if (aYear !== bYear) return aYear - bYear;

            // Find month index
            const aMonthIndex = monthNames.findIndex((month) =>
              aDateStr.includes(month)
            );
            const bMonthIndex = monthNames.findIndex((month) =>
              bDateStr.includes(month)
            );

            return aMonthIndex - bMonthIndex;
          }

          // Default: use date object comparison for regular dates
          return new Date(aDateStr) - new Date(bDateStr);
        });
      });

      // For each profile, create a worksheet
      for (const [profileId, profileData] of Object.entries(profilesData)) {
        // Use the profile object stored earlier
        const profileObj = profileData.profileObj;
        const profileName = profileData.profileName;
        const networkType = profileData.network;
        const networkDisplay =
          NETWORK_DISPLAY_NAMES[networkType] || networkType;

        // Create a unique sheet name based on profile name and network with the full ID
        // to absolutely ensure uniqueness
        let baseSheetName = `${profileName} - ${networkDisplay}`
          .substring(0, 20) // Leave room for ID and potential counter
          .replace(/[\[\]\*\?\/\\\:]/g, "_");

        // Ensure sheet name is unique by adding profile ID
        let sheetName = `${baseSheetName} (${profileId})`;
        let counter = 1;

        // Trim if exceeding Excel's 31 character limit
        if (sheetName.length > 31) {
          const maxLength = 31 - `(${profileId})`.length;
          baseSheetName = baseSheetName.substring(0, maxLength);
          sheetName = `${baseSheetName}(${profileId})`;
        }

        while (usedSheetNames.has(sheetName)) {
          // Add counter for truly exceptional cases of collision
          sheetName = `${baseSheetName}(${profileId}_${counter})`;
          counter++;

          // Ensure we stay within Excel's 31 character limit
          if (sheetName.length > 31) {
            const maxLength = 31 - `(${profileId}_${counter})`.length;
            baseSheetName = baseSheetName.substring(0, maxLength);
            sheetName = `${baseSheetName}(${profileId}_${counter})`;
          }
        }

        // Add this sheet name to used names
        usedSheetNames.add(sheetName);

        // Process the data for Excel including adding totals
        const processedData = [];

        // Calculate totals and find last values for each metric
        const totals = {};
        const lastValues = {};

        // Get the first row to identify metrics
        const firstRow = profileData.rows[0] || {};
        const metrics = Object.keys(firstRow).filter(
          (key) =>
            key !== "Date" &&
            key !== "Network" &&
            key !== "profile_id" &&
            key !== "Profile Name" &&
            !key.includes("followers_count")
        );

        // Identify rate metrics that need special handling
        const rateMetrics = metrics.filter(
          (key) =>
            key.includes("engagement_rate_per_follower") ||
            key.includes("engagement_rate_per_impression")
        );

        // Track the component values needed for calculating rates
        const rateComponents = {
          calculated_engagements: 0,
          impressions: 0,
          lifetime_snapshot_followers_count: 0,
        };

        // Initialize totals
        metrics.forEach((metric) => {
          totals[metric] = 0;
          lastValues[metric] = null;
        });

        // Process each row and calculate totals
        profileData.rows.forEach((row, index) => {
          const formattedRow = { ...row };

          // Always set the Profile Name to ensure consistency
          formattedRow["Profile Name"] = profileName;

          // Replace profile_id with profile name if it exists
          if ("profile_id" in formattedRow) {
            // Remove the original profile_id property
            delete formattedRow.profile_id;
          }

          // Format rate metrics as percentages
          Object.keys(formattedRow).forEach((key) => {
            // Check if this is a rate metric that should be formatted as percentage
            const isRateMetric = key.includes("rate") || key.includes("Rate");

            if (isRateMetric && typeof formattedRow[key] === "number") {
              // Format as percentage with 2 decimal places
              formattedRow[key] = formattedRow[key] * 100;
            }

            // Calculate totals for numeric values (except follower counts)
            if (
              typeof formattedRow[key] === "number" &&
              !key.includes("followers_count") &&
              key !== "Date" &&
              key !== "Network" &&
              key !== "Profile Name"
            ) {
              // Don't total up rate metrics, we'll calculate them later based on components
              if (!rateMetrics.includes(key)) {
                totals[key] = (totals[key] || 0) + formattedRow[key];
              }

              // Track component values for rate calculations if present
              if (key === "calculated_engagements") {
                rateComponents.calculated_engagements += formattedRow[key];
              }
              if (key === "impressions") {
                rateComponents.impressions += formattedRow[key];
              }

              lastValues[key] = formattedRow[key]; // Store the last value
            }

            // Track the last follower count for rate calculations
            if (
              key === "lifetime_snapshot.followers_count" &&
              formattedRow[key] !== null
            ) {
              // For follower count, we'll use the last value for calculations
              rateComponents.lifetime_snapshot_followers_count =
                formattedRow[key];
            }

            // Convert any objects or arrays to strings
            if (
              typeof formattedRow[key] === "object" &&
              formattedRow[key] !== null
            ) {
              formattedRow[key] = JSON.stringify(formattedRow[key]);
            }
          });

          processedData.push(formattedRow);
        });

        // Add a total row
        const totalRow = {
          Date: "TOTAL",
          Network: profileData.network,
          "Profile Name": profileName,
        };

        // Add a last value row
        const lastRow = {
          Date: "LAST VALUE",
          Network: profileData.network,
          "Profile Name": profileName,
        };

        // Add the totals and last values for each metric
        metrics.forEach((metric) => {
          // For rate metrics, calculate them properly instead of summing
          if (metric === "engagement_rate_per_follower") {
            // Calculate based on components: engagements / followers
            if (rateComponents.lifetime_snapshot_followers_count > 0) {
              totalRow[metric] =
                (rateComponents.calculated_engagements /
                  rateComponents.lifetime_snapshot_followers_count) *
                100;
            } else {
              totalRow[metric] = "N/A";
            }
          } else if (metric === "engagement_rate_per_impression") {
            // Calculate based on components: engagements / impressions
            if (rateComponents.impressions > 0) {
              totalRow[metric] =
                (rateComponents.calculated_engagements /
                  rateComponents.impressions) *
                100;
            } else {
              totalRow[metric] = "N/A";
            }
          } else {
            // For non-rate metrics, use the sum
            totalRow[metric] = totals[metric];
          }

          lastRow[metric] = lastValues[metric];
        });

        // Add follower count to last row but not to total
        const followerCountKeys = Object.keys(firstRow).filter((key) =>
          key.includes("followers_count")
        );

        followerCountKeys.forEach((key) => {
          const lastRowWithFollowers = [...profileData.rows]
            .reverse()
            .find((row) => row[key] !== undefined && row[key] !== null);

          if (lastRowWithFollowers) {
            lastRow[key] = lastRowWithFollowers[key];
            totalRow[key] = "N/A"; // Not applicable for totals
          }
        });

        // Add the total and last rows to the processed data
        processedData.push(totalRow, lastRow);

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(processedData);

        // Add percentage formatting for rate columns
        const range = XLSX.utils.decode_range(ws["!ref"]);

        // Check each column header to see if it's a rate
        for (let C = range.s.c; C <= range.e.c; C++) {
          const headerCellRef = XLSX.utils.encode_cell({ r: 0, c: C });
          const headerCell = ws[headerCellRef];

          if (
            headerCell &&
            (headerCell.v.includes("rate") || headerCell.v.includes("Rate"))
          ) {
            // Apply percentage format to all cells in this column
            for (let R = 1; R <= range.e.r; R++) {
              const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
              if (ws[cellRef]) {
                ws[cellRef].z = '0.00"%"';
              }
            }
          }
        }

        // Add the worksheet to the workbook
        try {
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        } catch (sheetError) {
          console.error(`Error adding worksheet ${sheetName}:`, sheetError);

          // If this is a duplicate sheet name error, try one more approach with a timestamp
          if (
            sheetError.message &&
            sheetError.message.includes("already exists")
          ) {
            // Use timestamp to ensure uniqueness
            const timestamp = new Date().getTime().toString().slice(-6);
            const fallbackName = `Sheet_${timestamp}`;

            try {
              XLSX.utils.book_append_sheet(wb, ws, fallbackName);
            } catch (fallbackError) {
              console.error(`Failed to add with fallback name:`, fallbackError);
              // Continue with the loop to process other profiles
            }
          }
        }
      }

      // Generate filename with date range
      const startStr = safeFormat(startDate, "yyyy-MM-dd");
      const endStr = safeFormat(endDate, "yyyy-MM-dd");
      let formatStr = "";

      // Include the export format in the filename
      switch (exportFormat) {
        case "monthly":
          formatStr = "_Monthly";
          break;
        case "quarterly":
          formatStr = "_Quarterly";
          break;
        case "yearly":
          formatStr = "_Yearly";
          break;
        default:
          formatStr = "_Daily";
      }

      // Limit filename length to avoid issues
      let filename = `SproutSocial_Analytics${formatStr}_${startStr}_to_${endStr}.xlsx`;
      if (filename.length > 200) {
        // If filename is too long, create a shorter version
        filename = `SproutSocial_Analytics_${exportFormat}_${startStr}_to_${endStr}.xlsx`;
      }

      // Export the workbook
      XLSX.writeFile(wb, filename);

      toast.success("Excel file exported successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError(`Error exporting to Excel: ${error.message}`);
      throw error; // Re-throw to allow proper error handling in calling function
    }
  };

  // Add helper function to check if metrics are selected for the active network
  const hasSelectedMetrics = () => {
    // Find which networks have profiles selected
    const networksWithSelectedProfiles = selectedNetworks.filter(
      (networkType) => {
        const networkProfiles = profiles.filter(
          (profile) =>
            profile.network_type === networkType ||
            (networkType === "facebook" &&
              (profile.network_type === "fb_page" ||
                profile.network_type === "facebook"))
        );

        const selectedProfilesForNetwork = selectedProfiles.filter(
          (profileId) =>
            networkProfiles.some(
              (profile) => profile.customer_profile_id === profileId
            )
        );

        return selectedProfilesForNetwork.length > 0;
      }
    );

    // Check if any of these networks have metrics selected
    const hasMetrics = networksWithSelectedProfiles.some((networkType) => {
      const metrics = selectedMetricsByNetwork[networkType];
      return metrics && metrics.length > 0;
    });

    return hasMetrics;
  };

  // Handle export format change
  const handleExportFormatChange = (format) => {
    setExportFormat(format);

    // If yearly format is selected, set the date range to the selected year
    if (format === "yearly") {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();

      // If selected year is current year, set end date to today
      if (selectedYear === currentYear) {
        // For fiscal year, start from April 1st
        setStartDate(new Date(selectedYear, 3, 1)); // April 1st of selected year
        setEndDate(new Date()); // Today
      } else {
        // For past fiscal years, set to full fiscal year (April 1st to March 31st)
        setStartDate(new Date(selectedYear, 3, 1)); // April 1st
        setEndDate(new Date(selectedYear + 1, 2, 31)); // March 31st of next year
      }
    }
  };

  // Handle date change with validation
  const handleStartDateChange = (date) => {
    setStartDate(date);

    // If end date is before start date, update end date
    if (endDate && date > endDate) {
      setEndDate(date);
    }

    // If date range exceeds one year, show warning
    if (endDate) {
      const diffTime = Math.abs(endDate.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 365) {
        toast.error(
          "Date range cannot exceed one year. End date will be adjusted."
        );
        // Set end date to one year after start date
        const newEndDate = new Date(date);
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        setEndDate(newEndDate);
      }
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);

    // If start date is after end date, update start date
    if (startDate && date < startDate) {
      setStartDate(date);
    }

    // If date range exceeds one year, show warning
    if (startDate) {
      const diffTime = Math.abs(date.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 365) {
        toast.error(
          "Date range cannot exceed one year. Start date will be adjusted."
        );
        // Set start date to one year before end date
        const newStartDate = new Date(date);
        newStartDate.setFullYear(newStartDate.getFullYear() - 1);
        setStartDate(newStartDate);
      }
    }
  };

  // Handle year selection
  const handleYearChange = (year) => {
    const yearNum = parseInt(year);
    setSelectedYear(yearNum);

    // Only update dates if yearly format is selected
    if (exportFormat === "yearly") {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();

      // If selected year is current year, set end date to today
      if (yearNum === currentYear) {
        // For fiscal year, start from April 1st
        setStartDate(new Date(yearNum, 3, 1)); // April 1st of selected year
        setEndDate(new Date()); // Today
      } else {
        // For past fiscal years, set to full fiscal year (April 1st to March 31st)
        setStartDate(new Date(yearNum, 3, 1)); // April 1st
        setEndDate(new Date(yearNum + 1, 2, 31)); // March 31st of next year
      }
    }
  };

  // Generate years for dropdown (from 1990 to current year)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];

    // Generate fiscal years (from 1990 to current year)
    for (let year = currentYear; year >= 1990; year--) {
      years.push({
        value: year,
        label: `FY${year}-${String(year + 1).slice(-2)}`,
      });
    }

    return years;
  };

  // Update the handleExportToExcel function to include validation
  const handleExportToExcel = async () => {
    setLoading(true);
    setError(null);
    setAnalyticsData(null); // Clear previous data

    try {
      // Validate date range
      if (!validateDateRange()) {
        setLoading(false);
        return;
      }

      // Validate inputs
      if (selectedProfiles.length === 0) {
        toast.error("Please select at least one profile");
        setLoading(false);
        return;
      }

      // Check if any metrics are selected
      const hasSelectedMetrics = Object.values(selectedMetricsByNetwork).some(
        (metrics) => metrics && metrics.length > 0
      );

      if (!hasSelectedMetrics) {
        toast.error("Please select at least one metric for export");
        setLoading(false);
        return;
      }

      // Group profiles by network type
      const profilesByNetwork = {};

      // Get profiles that are selected
      const selectedProfilesData = selectedProfiles
        .map((id) => {
          return (
            profilesMap[id] ||
            profiles.find((p) => p.customer_profile_id === id)
          );
        })
        .filter(Boolean);

      // Group them by network type
      selectedProfilesData.forEach((profile) => {
        const networkType = profile.network_type;
        if (!profilesByNetwork[networkType]) {
          profilesByNetwork[networkType] = [];
        }
        profilesByNetwork[networkType].push(profile);
      });

      // All formatted data that we'll collect from multiple API calls
      const allFormattedData = [];

      // Process each network type separately
      for (const [networkType, networkProfiles] of Object.entries(
        profilesByNetwork
      )) {
        const profileIds = networkProfiles.map((p) => p.customer_profile_id);
        const selectedMetrics = selectedMetricsByNetwork[networkType] || [];

        // Get the selected metrics with all dependencies for calculated metrics
        const apiMetrics = getMetricsWithDependencies(selectedMetrics);

        try {
          // Always fetch daily data first
          const apiParams = {
            customerId,
            profileId: profileIds,
            startDate: safeFormat(startDate, "yyyy-MM-dd"),
            endDate: safeFormat(endDate, "yyyy-MM-dd"),
            reportingPeriod: "daily", // Always fetch daily data
            metrics: apiMetrics,
          };

          console.log(
            `Making API call for ${networkType} with ${profileIds.length} profiles`
          );
          const response = await getProfileAnalytics(apiParams);

          if (!response) {
            console.warn(`No response for ${networkType}, skipping`);
            toast.error(
              `No data available for ${
                NETWORK_DISPLAY_NAMES[networkType] || networkType
              }`
            );
            continue;
          }

          if (!response.data || response.data.length === 0) {
            toast.error(
              `No data available for the selected date range for ${
                NETWORK_DISPLAY_NAMES[networkType] || networkType
              }`
            );
            continue;
          }

          // Format the data with the appropriate formatter
          const formatter = getNetworkFormatter(networkType);
          const formattedData = formatter(response, selectedMetrics);

          if (formattedData && formattedData.length > 0) {
            // Process the formatted data based on export format
            let processedData = formattedData;

            // If not daily format, aggregate the data
            if (exportFormat !== "daily") {
              processedData = groupDataByReportingPeriod(
                formattedData,
                exportFormat,
                new Date(startDate),
                new Date(endDate)
              );
            }

            allFormattedData.push(...processedData);
          } else {
            toast.error(
              `No formatted data available for ${
                NETWORK_DISPLAY_NAMES[networkType] || networkType
              }`
            );
          }
        } catch (error) {
          console.error(`Error processing ${networkType}:`, error);
          toast.error(
            `Error processing data for ${
              NETWORK_DISPLAY_NAMES[networkType] || networkType
            }: ${error.message}`
          );
          // Continue with other networks even if one fails
        }
      }

      // Check if we have any data to export
      if (allFormattedData.length === 0) {
        toast.error(
          "No data available to export. Please check your selections and try again."
        );
        setLoading(false);
        return;
      }

      // Export the collected data
      await exportToExcel(allFormattedData);
      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Error in handleExportToExcel:", error);
      toast.error(`Error exporting data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle selecting all visible profiles for a network
  const handleSelectAllForNetwork = (networkType) => {
    const visibleProfiles = searchResults[networkType] || [];

    // Check if all visible profiles are already selected
    const allSelected = visibleProfiles.every((profile) =>
      selectedProfiles.includes(profile.customer_profile_id)
    );

    if (allSelected) {
      // Deselect all visible profiles
      setSelectedProfiles((prevSelected) =>
        prevSelected.filter(
          (id) =>
            !visibleProfiles.some(
              (profile) => profile.customer_profile_id === id
            )
        )
      );
    } else {
      // Select all visible profiles
      const visibleProfileIds = visibleProfiles.map(
        (profile) => profile.customer_profile_id
      );
      const alreadySelectedIds = selectedProfiles.filter(
        (id) =>
          !visibleProfiles.some((profile) => profile.customer_profile_id === id)
      );

      setSelectedProfiles([...alreadySelectedIds, ...visibleProfileIds]);
    }
  };

  /**
   * Handle click on Export button
   */
  const handleExport = () => {
    if (selectedNetworkType === "youtube") {
      // For YouTube, provide option to go to Post Metrics
      setShowYoutubeMetricsModal(true);
    } else {
      handleExportToExcel();
    }
  };

  /**
   * Handle navigating to YouTube Post Metrics
   */
  const handleGoToYoutubePostMetrics = () => {
    window.location.href = YOUTUBE_POST_METRICS_PATH;
  };

  // Validate date range
  const validateDateRange = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return false;
    }

    if (startDate.getTime() === endDate.getTime()) {
      toast.error("Start and end dates cannot be the same");
      return false;
    }

    // Calculate the difference in days
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      toast.error(
        "Date range cannot exceed one year. Please select a shorter period."
      );
      return false;
    }

    return true;
  };

  return (
    <div>
      {/* Report configuration panel - Always shown */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {/* Export Format */}
          <div className="mb-6">
            <Label htmlFor="export-format" className="block mb-2">
              Export Format
            </Label>
            <Select
              value={exportFormat}
              onValueChange={handleExportFormatChange}
            >
              <SelectTrigger
                id="export-format"
                className="w-full border border-gray-300 bg-white"
              >
                <SelectValue placeholder="Select export format" />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMATS.map((format) => (
                  <SelectItem key={format.id} value={format.id}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {exportFormat === "yearly" ? (
              <div className="md:col-span-2">
                <Label htmlFor="year-select" className="block mb-2">
                  Select Fiscal Year
                </Label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={handleYearChange}
                >
                  <SelectTrigger
                    id="year-select"
                    className="w-full border border-gray-300 bg-white"
                  >
                    <SelectValue placeholder="Select a fiscal year" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateYearOptions().map((year) => (
                      <SelectItem
                        key={year.value}
                        value={year.value.toString()}
                      >
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2 text-sm text-gray-500">
                  {selectedYear === new Date().getFullYear()
                    ? `Date range: April 1, ${selectedYear} to today`
                    : `Date range: April 1, ${selectedYear} to March 31, ${
                        selectedYear + 1
                      }`}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="start-date" className="block mb-2">
                    Start Date
                  </Label>
                  <DatePicker
                    selected={startDate}
                    onChange={handleStartDateChange}
                    dateFormat="MMMM d, yyyy"
                    className="border border-gray-300 p-2 rounded-md w-full"
                    placeholderText="Select a start date"
                    maxDate={endDate || new Date()}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="block mb-2">
                    End Date
                  </Label>
                  <DatePicker
                    selected={endDate}
                    onChange={handleEndDateChange}
                    dateFormat="MMMM d, yyyy"
                    className="border border-gray-300 p-2 rounded-md w-full"
                    placeholderText="Select an end date"
                    minDate={startDate}
                    maxDate={new Date()}
                  />
                </div>
              </>
            )}
          </div>

          {/* Networks Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Networks</h3>
              <Button
                variant="outline"
                className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50"
                onClick={() => setShowNetworkSelector(true)}
              >
                Add Network
              </Button>
            </div>

            {showNetworkSelector && (
              <div className="mb-4 p-4 border rounded-md bg-gray-50">
                <h4 className="font-medium mb-2">Select a Network</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(NETWORK_DISPLAY_NAMES)
                    .filter(([key, _]) => {
                      // Only show networks that have profiles and aren't already selected
                      const networkHasProfiles = profiles.some(
                        (profile) => profile.network_type === key
                      );
                      return (
                        networkHasProfiles && !selectedNetworks.includes(key)
                      );
                    })
                    .map(([key, value]) => (
                      <Button
                        key={key}
                        variant="outline"
                        className="justify-start bg-white border border-gray-300 text-gray-800 hover:bg-gray-50"
                        onClick={() => handleAddNetwork(key)}
                      >
                        {value}
                      </Button>
                    ))}
                </div>
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    className="text-gray-500"
                    onClick={() => setShowNetworkSelector(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Selected Networks */}
            <div className="space-y-4">
              {selectedNetworks.map((networkType) => {
                const displayName =
                  NETWORK_DISPLAY_NAMES[networkType] || networkType;
                const networkProfiles = profiles.filter(
                  (profile) => profile.network_type === networkType
                );

                if (networkProfiles.length === 0) return null;

                return (
                  <div key={networkType} className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">{displayName}</h3>
                      <Button
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          setSelectedNetworks(
                            selectedNetworks.filter((n) => n !== networkType)
                          );
                          setSelectedProfiles(
                            selectedProfiles.filter(
                              (id) =>
                                !networkProfiles.some(
                                  (p) => p.customer_profile_id === id
                                )
                            )
                          );
                        }}
                      >
                        Remove
                      </Button>
                    </div>

                    {/* Profiles for this network */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="block">Select Profiles</Label>
                        <div className="relative w-1/2">
                          <input
                            type="text"
                            placeholder="Search profiles..."
                            className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerms[networkType] || ""}
                            onChange={(e) =>
                              handleSearchChange(networkType, e.target.value)
                            }
                          />
                          {searchTerms[networkType] && (
                            <button
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              onClick={() =>
                                handleSearchChange(networkType, "")
                              }
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                        {/* Select All option */}
                        {(searchResults[networkType] || []).length > 0 && (
                          <div className="col-span-2 border-b border-gray-200 pb-2 mb-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`select-all-${networkType}`}
                                checked={
                                  (searchResults[networkType] || []).length >
                                    0 &&
                                  (
                                    searchResults[networkType] || []
                                  ).every((profile) =>
                                    selectedProfiles.includes(
                                      profile.customer_profile_id
                                    )
                                  )
                                }
                                onCheckedChange={() =>
                                  handleSelectAllForNetwork(networkType)
                                }
                              />
                              <Label
                                htmlFor={`select-all-${networkType}`}
                                className="font-medium cursor-pointer"
                              >
                                Select All{" "}
                                {searchTerms[networkType] ? "Filtered" : ""}{" "}
                                Profiles
                                {searchTerms[networkType]
                                  ? ` (${
                                      (searchResults[networkType] || []).length
                                    })`
                                  : ""}
                              </Label>
                            </div>
                          </div>
                        )}

                        {(searchResults[networkType] || []).map((profile) => (
                          <div
                            key={profile.customer_profile_id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`profile-${profile.customer_profile_id}`}
                              checked={selectedProfiles.includes(
                                profile.customer_profile_id
                              )}
                              onCheckedChange={() =>
                                handleProfileSelection(
                                  profile.customer_profile_id
                                )
                              }
                            />
                            <Label
                              htmlFor={`profile-${profile.customer_profile_id}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {profile.name ||
                                profile.native_name ||
                                "Unnamed Profile"}
                            </Label>
                          </div>
                        ))}
                        {searchTerms[networkType] &&
                          (searchResults[networkType] || []).length === 0 && (
                            <div className="col-span-2 text-center py-2 text-gray-500">
                              No profiles found matching &quot;
                              {searchTerms[networkType]}&quot;
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Metrics for this network */}
                    <div>
                      <Label className="block mb-2">Select Metrics</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {(() => {
                          let metricsKey = networkType;
                          if (
                            networkType === "facebook" ||
                            networkType === "fb_page"
                          ) {
                            metricsKey = "facebook";
                          }

                          // Get metrics for this network type
                          const metrics = NETWORK_METRICS[metricsKey] || [];

                          // Get selected metrics for this network
                          const networkMetrics =
                            selectedMetricsByNetwork[networkType] || [];

                          return metrics.map((metric) => (
                            <div
                              key={`${networkType}-${metric.id}`}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`metric-${networkType}-${metric.id}`}
                                checked={networkMetrics.includes(metric.id)}
                                onCheckedChange={() =>
                                  handleMetricSelection(networkType, metric.id)
                                }
                              />
                              <Label
                                htmlFor={`metric-${networkType}-${metric.id}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {metric.label}
                              </Label>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-50"
          onClick={handleExport}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            "Export to Excel"
          )}
        </Button>
      </div>

      {/* YouTube Post Metrics Modal */}
      {showYoutubeMetricsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              YouTube Analytics Options
            </h3>
            <p className="mb-4">
              Would you like to export regular analytics or view post-level
              metrics?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowYoutubeMetricsModal(false);
                  handleExportToExcel();
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Export Regular Analytics
              </button>
              <button
                onClick={handleGoToYoutubePostMetrics}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                View Post Metrics
              </button>
            </div>
            <button
              onClick={() => setShowYoutubeMetricsModal(false)}
              className="mt-3 w-full px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
