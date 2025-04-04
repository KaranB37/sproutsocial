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

  // New state for advanced export options
  const [selectedQuarters, setSelectedQuarters] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [showQuarterWarning, setShowQuarterWarning] = useState(false);

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

  // Generate available quarters for selection
  const getAvailableQuarters = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Determine current quarter (0-3 based)
    const currentQuarter = Math.floor(currentMonth / 3);

    // Get fiscal year quarters
    // Q1: April-June (fiscal year starts in April)
    // Q2: July-September
    // Q3: October-December
    // Q4: January-March (belongs to the previous fiscal year)

    const quarters = [];

    // Current fiscal year
    const fiscalYear = currentMonth >= 3 ? currentYear : currentYear - 1;

    // Add quarters for current fiscal year
    for (let q = 0; q < 4; q++) {
      const quarterLabel = getQuarterLabel(q, fiscalYear);

      // For Q4 (Jan-Mar), check if we've already passed it this calendar year
      if (q === 3 && currentMonth > 2) {
        quarters.push({
          id: `FY${fiscalYear}-Q4`,
          label: quarterLabel,
          fiscalYear: fiscalYear,
        });
      }
      // For current quarter, mark as "Till Date"
      else if (
        (q === 0 && currentMonth >= 3 && currentMonth < 6) ||
        (q === 1 && currentMonth >= 6 && currentMonth < 9) ||
        (q === 2 && currentMonth >= 9)
      ) {
        quarters.push({
          id: `FY${fiscalYear}-Q${q + 1}`,
          label: `${quarterLabel} (Till Date)`,
          fiscalYear: fiscalYear,
          current: true,
        });
      }
      // For past quarters in current fiscal year
      else if (
        (q === 0 && currentMonth >= 6) ||
        (q === 1 && currentMonth >= 9) ||
        (q === 2 && currentMonth >= 0 && currentMonth < 3)
      ) {
        quarters.push({
          id: `FY${fiscalYear}-Q${q + 1}`,
          label: quarterLabel,
          fiscalYear: fiscalYear,
        });
      }
    }

    // Add quarters for previous fiscal year
    const prevFiscalYear = fiscalYear - 1;
    for (let q = 0; q < 4; q++) {
      quarters.push({
        id: `FY${prevFiscalYear}-Q${q + 1}`,
        label: getQuarterLabel(q, prevFiscalYear),
        fiscalYear: prevFiscalYear,
      });
    }

    // Add quarters for fiscal year before that
    const prevPrevFiscalYear = fiscalYear - 2;
    for (let q = 0; q < 4; q++) {
      quarters.push({
        id: `FY${prevPrevFiscalYear}-Q${q + 1}`,
        label: getQuarterLabel(q, prevPrevFiscalYear),
        fiscalYear: prevPrevFiscalYear,
      });
    }

    return quarters;
  };

  // Generate available fiscal years for selection
  const getAvailableYears = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Current fiscal year
    const fiscalYear = currentMonth >= 3 ? currentYear : currentYear - 1;

    const years = [];

    // Current fiscal year (may be till date)
    years.push({
      id: `FY${fiscalYear}`,
      label: `FY${fiscalYear}-${String(fiscalYear + 1).slice(-2)} ${
        currentMonth < 3 ? "(Till Date)" : ""
      }`,
      fiscalYear,
    });

    // Previous 5 fiscal years
    for (let i = 1; i <= 5; i++) {
      const year = fiscalYear - i;
      years.push({
        id: `FY${year}`,
        label: `FY${year}-${String(year + 1).slice(-2)}`,
        fiscalYear: year,
      });
    }

    return years;
  };

  // Helper function to get quarter label
  const getQuarterLabel = (quarter, fiscalYear) => {
    switch (quarter) {
      case 0:
        return `Q1 (Apr-Jun) FY${fiscalYear}-${String(fiscalYear + 1).slice(
          -2
        )}`;
      case 1:
        return `Q2 (Jul-Sep) FY${fiscalYear}-${String(fiscalYear + 1).slice(
          -2
        )}`;
      case 2:
        return `Q3 (Oct-Dec) FY${fiscalYear}-${String(fiscalYear + 1).slice(
          -2
        )}`;
      case 3:
        return `Q4 (Jan-Mar) FY${fiscalYear}-${String(fiscalYear + 1).slice(
          -2
        )}`;
      default:
        return `Unknown Quarter FY${fiscalYear}`;
    }
  };

  // Handle quarter selection
  const handleQuarterSelection = (quarter) => {
    setSelectedQuarters((prev) => {
      // If already selected, remove it
      if (prev.includes(quarter)) {
        return prev.filter((q) => q !== quarter);
      }

      // If adding would exceed 3 quarters, show warning and limit to 3
      if (prev.length >= 3) {
        setShowQuarterWarning(true);
        return [...prev.slice(1), quarter]; // Remove oldest, add newest
      }

      setShowQuarterWarning(false);
      return [...prev, quarter];
    });
  };

  // Handle year selection
  const handleYearSelection = (year) => {
    setSelectedYears((prev) => {
      if (prev.includes(year)) {
        return prev.filter((y) => y !== year);
      }
      return [...prev, year];
    });
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

      console.log(`Preparing ${data.length} rows for Excel export`);

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Track used sheet names to prevent duplicates
      const usedSheetNames = new Set();

      // Group data by profile_id
      const profilesData = {};

      data.forEach((row) => {
        const profileId = row.profile_id || "unknown";
        const network = row.Network || "Unknown";

        if (!profilesData[profileId]) {
          profilesData[profileId] = {
            network,
            rows: [],
          };
        }

        profilesData[profileId].rows.push(row);
      });

      // Sort each profile's data by date
      Object.keys(profilesData).forEach((profileId) => {
        profilesData[profileId].rows.sort((a, b) => {
          // First check if data is already aggregated with fiscal year/quarter format
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
        // Find profile name from list of profiles
        const profile = profiles.find(
          (p) => p.customer_profile_id.toString() === profileId.toString()
        );
        const profileName = profile
          ? profile.name || profile.native_name || profileId
          : profileId;

        // Create a clean sheet name (remove invalid characters)
        // Add a unique identifier based on profile ID to prevent duplicate sheet names
        let shortProfileId = profileId.toString().substring(0, 5);
        let baseSheetName = `${profileData.network} - ${profileName} (${shortProfileId})`
          .substring(0, 28) // Leave room for counter suffix
          .replace(/[\[\]\*\?\/\\\:]/g, "_");

        // Ensure sheet name is unique
        let sheetName = baseSheetName;
        let counter = 1;

        while (usedSheetNames.has(sheetName)) {
          sheetName = `${baseSheetName}_${counter}`;
          counter++;

          if (sheetName.length > 31) {
            // Excel has a 31 character limit for sheet names
            // If we exceed it, trim the baseSheetName further
            baseSheetName = baseSheetName.substring(
              0,
              27 - counter.toString().length
            );
            sheetName = `${baseSheetName}_${counter}`;
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

        // Initialize totals
        metrics.forEach((metric) => {
          totals[metric] = 0;
          lastValues[metric] = null;
        });

        // Process each row and calculate totals
        profileData.rows.forEach((row, index) => {
          const formattedRow = { ...row };

          // Replace profile_id with profile name and rename the column
          if ("profile_id" in formattedRow) {
            // Look up the profile by ID and get the actual name
            const rowProfileId = formattedRow.profile_id.toString();
            const profileObj = profiles.find(
              (p) => p.customer_profile_id.toString() === rowProfileId
            );

            if (profileObj) {
              // Use the profile's actual name
              formattedRow["Profile Name"] =
                profileObj.name || profileObj.native_name;
              console.log(
                `Found profile name: ${formattedRow["Profile Name"]} for ID: ${rowProfileId}`
              );
            } else {
              // Fallback if profile not found
              formattedRow["Profile Name"] = profileName;
              console.log(
                `Using fallback name: ${profileName} for ID: ${rowProfileId}`
              );
            }

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
              totals[key] = (totals[key] || 0) + formattedRow[key];
              lastValues[key] = formattedRow[key]; // Store the last value
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
          totalRow[metric] = totals[metric];
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
          console.log(`Added worksheet: ${sheetName}`);
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
              console.log(`Used fallback worksheet name: ${fallbackName}`);
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
          if (selectedQuarters.length > 0) {
            // Extract just the quarter numbers and fiscal years for the filename
            const quarterInfo = selectedQuarters
              .map((q) => {
                const parts = q.split("-");
                const fyPart = parts[0]; // FYxxxx
                const qPart = parts[1]; // Qx
                return `${qPart}_${fyPart}`;
              })
              .join("_");
            formatStr = `_Quarterly_${quarterInfo}`;
          } else {
            formatStr = "_Quarterly";
          }
          break;
        case "yearly":
          if (selectedYears.length > 0) {
            const yearInfo = selectedYears.join("_");
            formatStr = `_Yearly_${yearInfo}`;
          } else {
            formatStr = "_Yearly";
          }
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

  // Update the handleExportToExcel function to use the exportFormat state variable and the groupDataByReportingPeriod utility
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

      // Validate quarter/year selection
      if (exportFormat === "quarterly" && selectedQuarters.length === 0) {
        setError("Please select at least one quarter for quarterly export");
        return;
      }

      if (exportFormat === "yearly" && selectedYears.length === 0) {
        setError("Please select at least one fiscal year for yearly export");
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
          reportingPeriod: exportFormat,
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

      // If export format is not daily, aggregate the data by the selected period
      let dataToExport = formattedData;
      if (exportFormat === "quarterly" && selectedQuarters.length > 0) {
        console.log(
          `Aggregating data by selected quarters: ${selectedQuarters.join(
            ", "
          )}`
        );

        try {
          // For quarterly with specific quarters selected
          // We'll need to filter data to only include the selected quarters
          const aggregatedData = groupDataByReportingPeriod(
            formattedData,
            exportFormat,
            new Date(startDate),
            new Date(endDate)
          );

          // Filter to only keep selected quarters
          dataToExport = aggregatedData.filter((row) => {
            // Check if the row Date contains any of the selected quarter IDs
            return selectedQuarters.some((quarter) => {
              const quarterPattern = quarter.replace("FY", "FY\\d+-\\d+.*Q"); // e.g., "FY2023-Q1" becomes "FY\d+-\d+.*Q1"
              const regex = new RegExp(quarterPattern);
              return regex.test(row.Date);
            });
          });

          console.log(
            `Filtered to ${dataToExport.length} rows from selected quarters`
          );
        } catch (aggregationError) {
          console.error("Error aggregating quarterly data:", aggregationError);
          setError(
            `Error aggregating quarterly data: ${aggregationError.message}`
          );
          // Fallback to non-aggregated data
          dataToExport = formattedData;
        }
      } else if (exportFormat === "yearly" && selectedYears.length > 0) {
        console.log(
          `Aggregating data by selected years: ${selectedYears.join(", ")}`
        );

        try {
          // For yearly with specific years selected
          const aggregatedData = groupDataByReportingPeriod(
            formattedData,
            exportFormat,
            new Date(startDate),
            new Date(endDate)
          );

          // Filter to only keep selected years
          dataToExport = aggregatedData.filter((row) => {
            // Check if the row Date contains any of the selected year IDs
            return selectedYears.some((year) => {
              const yearPattern = year.replace("FY", "FY"); // e.g., "FY2023" remains "FY2023"
              const regex = new RegExp(yearPattern);
              return regex.test(row.Date);
            });
          });

          console.log(
            `Filtered to ${dataToExport.length} rows from selected years`
          );
        } catch (aggregationError) {
          console.error("Error aggregating yearly data:", aggregationError);
          setError(
            `Error aggregating yearly data: ${aggregationError.message}`
          );
          // Fallback to non-aggregated data
          dataToExport = formattedData;
        }
      } else if (exportFormat !== "daily") {
        console.log(`Aggregating data by ${exportFormat} period`);

        try {
          // Regular aggregation for monthly or when no specific quarters/years are selected
          dataToExport = groupDataByReportingPeriod(
            formattedData,
            exportFormat,
            new Date(startDate),
            new Date(endDate)
          );

          console.log(
            `Successfully aggregated data: ${dataToExport.length} rows`
          );
        } catch (aggregationError) {
          console.error("Error aggregating data:", aggregationError);
          setError(`Error aggregating data: ${aggregationError.message}`);
          // Fallback to non-aggregated data
          dataToExport = formattedData;
        }
      }

      // Export to Excel
      try {
        await exportToExcel(dataToExport);
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
            {/* Export Format */}
            <div className="mb-6">
              <Label htmlFor="export-format" className="block mb-2">
                Export Format
              </Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
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

              {/* Show quarter selection if quarterly export format is selected */}
              {exportFormat === "quarterly" && (
                <div className="mt-4">
                  <Label className="block mb-2">Select Quarters (Max 3)</Label>
                  {showQuarterWarning && (
                    <p className="text-yellow-500 text-xs mb-2">
                      Only a maximum of 3 quarters can be selected. Oldest
                      selection was removed.
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {getAvailableQuarters().map((quarter) => (
                      <div
                        key={quarter.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`quarter-${quarter.id}`}
                          checked={selectedQuarters.includes(quarter.id)}
                          onCheckedChange={() =>
                            handleQuarterSelection(quarter.id)
                          }
                        />
                        <Label
                          htmlFor={`quarter-${quarter.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {quarter.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show year selection if yearly export format is selected */}
              {exportFormat === "yearly" && (
                <div className="mt-4">
                  <Label className="block mb-2">Select Fiscal Years</Label>
                  <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {getAvailableYears().map((year) => (
                      <div
                        key={year.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`year-${year.id}`}
                          checked={selectedYears.includes(year.id)}
                          onCheckedChange={() => handleYearSelection(year.id)}
                        />
                        <Label
                          htmlFor={`year-${year.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {year.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Date Range */}
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
                    Click &quot;Add Network&quot; to select networks for your
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
