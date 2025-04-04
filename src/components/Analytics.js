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
} from "@/utils/metricDefinitions";

// Define reporting period options
const REPORTING_PERIODS = [
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
    { id: "posts_sent_count", label: "Videos Published" },
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

const Analytics = ({ profiles, customerId }) => {
  // State for form inputs
  const [reportingPeriod, setReportingPeriod] = useState("daily");
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

  // Safe date formatting function
  const safeFormat = (date, formatStr) => {
    if (!date || !isValid(date)) return "";
    try {
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
              console.log(
                `Auto-selecting dependency ${dependency} for ${metricId}`
              );
              updatedNetworkMetrics.push(dependency);
            }
          });
        }
      }

      // Log the updated metrics for debugging
      console.log(`Updated metrics for ${networkType}:`, updatedNetworkMetrics);

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
        reportingPeriod: reportingPeriod,
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

      console.log(`Preparing ${data.length} rows for Excel export`);

      // Detailed logging of the first few rows for debugging
      console.log("First data row:", JSON.stringify(data[0]));
      console.log(
        "Second data row (if available):",
        data.length > 1 ? JSON.stringify(data[1]) : "N/A"
      );

      // Check if follower count is present
      const hasFollowerCount = data.some(
        (row) => row["lifetime_snapshot.followers_count"] !== undefined
      );
      console.log("Has follower count in data:", hasFollowerCount);

      if (!hasFollowerCount) {
        console.warn("No follower count found in any row!");
      }

      // Process the data for Excel
      const processedData = data.map((row, index) => {
        const formattedRow = { ...row };

        // Check this row for follower count
        if (index === 0) {
          console.log(
            `Row 0 follower count: ${formattedRow["lifetime_snapshot.followers_count"]}`
          );
        }

        // Format rate metrics as percentages
        Object.keys(formattedRow).forEach((key) => {
          // Check if this is a rate metric that should be formatted as percentage
          const isRateMetric = key.includes("rate") || key.includes("Rate");

          if (isRateMetric && typeof formattedRow[key] === "number") {
            // Format as percentage with 2 decimal places
            formattedRow[key] = formattedRow[key] * 100;
            if (index === 0) {
              console.log(
                `Formatting ${key} as percentage: ${formattedRow[key]}%`
              );
            }
          }

          // Convert any objects or arrays to strings
          if (
            typeof formattedRow[key] === "object" &&
            formattedRow[key] !== null
          ) {
            formattedRow[key] = JSON.stringify(formattedRow[key]);
          }
        });

        return formattedRow;
      });

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

      // Create a new workbook and add the sheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Social Analytics");

      // Generate filename with date range
      const startStr = safeFormat(startDate, "yyyy-MM-dd");
      const endStr = safeFormat(endDate, "yyyy-MM-dd");
      const filename = `SproutSocial_Analytics_${startStr}_to_${endStr}.xlsx`;

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

  // Update the handleExportToExcel function to use the correct formatter for Instagram
  const handleExportToExcel = async () => {
    setLoading(true);
    setError(null);
    setAnalyticsData(null); // Clear previous data

    try {
      // Validate inputs
      if (!startDate || !endDate) {
        setError("Please select start and end dates");
        return;
      }

      if (selectedProfiles.length === 0) {
        setError("Please select at least one profile");
        return;
      }

      // Find which network type we're exporting data for based on selected profiles
      let exportNetworkType = selectedNetworkType;
      const selectedProfileObjects = profiles.filter((p) =>
        selectedProfiles.includes(p.customer_profile_id)
      );

      if (selectedProfileObjects.length > 0) {
        // Get network type from the first selected profile
        const firstProfileType = selectedProfileObjects[0].network_type;

        // Normalize Facebook network types
        if (firstProfileType === "fb_page" || firstProfileType === "facebook") {
          exportNetworkType = "facebook";
        } else {
          exportNetworkType = firstProfileType;
        }

        console.log(
          "Export network type based on profiles:",
          exportNetworkType
        );
      }

      // Get metrics for the determined network type
      const selectedMetrics = selectedMetricsByNetwork[exportNetworkType] || [];
      console.log("Export network type:", exportNetworkType);
      console.log("All selected metrics by network:", selectedMetricsByNetwork);
      console.log("Selected metrics for export:", selectedMetrics);

      if (!selectedMetrics || selectedMetrics.length === 0) {
        setError(`Please select at least one metric for ${exportNetworkType}`);
        return;
      }

      // Get all required metrics including dependencies
      const apiMetrics = getMetricsWithDependencies(
        selectedMetrics,
        exportNetworkType
      );
      console.log("API metrics with dependencies:", apiMetrics);

      // Continue with API call using the determined network type and metrics
      let response;
      try {
        const apiParams = {
          customerId,
          profileId: selectedProfiles,
          startDate: safeFormat(startDate, "yyyy-MM-dd"),
          endDate: safeFormat(endDate, "yyyy-MM-dd"),
          reportingPeriod: reportingPeriod,
          metrics: apiMetrics,
        };

        console.log("API request params:", apiParams);

        response = await getProfileAnalytics(apiParams);
        console.log("Raw API response:", response);
      } catch (apiError) {
        console.error("API call failed:", apiError);
        setError(`API request failed: ${apiError.message}`);
        return;
      }

      if (!response) {
        setError("API returned no response");
        return;
      }

      // Format the data according to profile type using the network formatter
      let formattedData;
      try {
        console.log("Formatting data for network type:", exportNetworkType);

        // Get the appropriate formatter based on network type
        const formatter = getNetworkFormatter(exportNetworkType);
        formattedData = formatter(response, selectedMetrics);

        console.log("Formatted data sample:", formattedData.slice(0, 2));
        console.log("Total rows:", formattedData.length);
      } catch (formatError) {
        console.error("Error formatting data:", formatError);
        setError(`Error formatting data: ${formatError.message}`);
        return;
      }

      if (!formattedData || formattedData.length === 0) {
        setError("No data available to export after formatting");
        return;
      }

      // After successfully formatting the data, update the state
      setAnalyticsData(formattedData);

      // Export to Excel
      try {
        await exportToExcel(formattedData);
        toast.success("Excel file exported successfully!");
      } catch (exportError) {
        console.error("Error exporting to Excel:", exportError);
        setError(`Error exporting to Excel: ${exportError.message}`);
      }
    } catch (error) {
      console.error("General error:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        variant="outline"
        className="mb-4 bg-white border border-gray-300 text-gray-800 hover:bg-gray-50"
        onClick={() => setShowConfigPanel(!showConfigPanel)}
      >
        Configure Report
      </Button>

      {showConfigPanel && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            {/* Date Range and Reporting Period at the top */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="reporting-period" className="block mb-2">
                  Reporting Period
                </Label>
                <Select
                  value={reportingPeriod}
                  onValueChange={setReportingPeriod}
                >
                  <SelectTrigger
                    id="reporting-period"
                    className="w-full border border-gray-300 bg-white"
                  >
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORTING_PERIODS.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="start-date" className="block mb-2">
                  Start Date
                </Label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  dateFormat="MMMM d, yyyy"
                  className="border border-gray-300 p-2 rounded-md w-full"
                  placeholderText="Select a start date"
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="block mb-2">
                  End Date
                </Label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  dateFormat="MMMM d, yyyy"
                  className="border border-gray-300 p-2 rounded-md w-full"
                  placeholderText="Select an end date"
                />
              </div>
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
                        <Label className="block mb-2">Select Profiles</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {networkProfiles.map((profile) => (
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
                                    handleMetricSelection(
                                      networkType,
                                      metric.id
                                    )
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

                {selectedNetworks.length === 0 && (
                  <div className="p-4 border border-gray-200 rounded-md bg-gray-50 text-gray-500 text-center">
                    Click &quot; Add Network &quot; to select networks for your
                    report
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-2">
        <Button
          onClick={handleExportToExcel}
          disabled={
            loading || selectedProfiles.length === 0 || !hasSelectedMetrics()
          }
          className="bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark"
        >
          {loading ? "Exporting..." : "Export to Excel"}
        </Button>
      </div>

      {error && (
        <div className="p-4 mt-4 border border-red-200 bg-red-50 rounded-md text-red-800">
          {error}
        </div>
      )}

      {selectedProfiles.length === 0 && (
        <div className="p-4 mt-4 border border-yellow-200 bg-yellow-50 rounded-md text-yellow-800">
          Please select at least one profile
        </div>
      )}

      {selectedProfiles.length > 0 && !hasSelectedMetrics() && (
        <div className="p-4 mt-4 border border-yellow-200 bg-yellow-50 rounded-md text-yellow-800">
          Please select at least one metric
        </div>
      )}
    </div>
  );
};

export default Analytics;
