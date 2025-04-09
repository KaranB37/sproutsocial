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
import ExcelJS from "exceljs";

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
  instagram: "Instagram",
  linkedin: "LinkedIn",
  // Add any other network types that might be used
};

// Updated comprehensive network metrics based on Sprout Social API
const NETWORK_METRICS = {
  facebook: [
    { id: "lifetime_snapshot.followers_count", label: "Followers" },
    { id: "net_follower_growth", label: "Net Follower Growth" },
    { id: "followers_gained", label: "Followers Gained" },
    { id: "followers_lost", label: "Followers Lost" },
    { id: "impressions", label: "Impressions" },
    { id: "reactions", label: "Reactions" },
    { id: "comments_count", label: "Comments" },
    { id: "shares_count", label: "Shares" },
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
    // { id: "followers_by_job_function", label: "Followers By Job" },
    // { id: "followers_by_seniority", label: "Followers By Seniority" },
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

// Define calculated metrics for each network type
const CALCULATED_METRICS = {
  facebook: {
    engagements: {
      id: "engagements",
      label: "Engagements",
      dependencies: ["reactions", "comments", "shares"],
      calculate: (data) => {
        return (
          (data.reactions || 0) + (data.comments || 0) + (data.shares || 0)
        );
      },
    },
    engagement_rate: {
      id: "engagement_rate",
      label: "Engagement Rate",
      dependencies: ["engagements", "impressions"],
      calculate: (data) => {
        if (!data.impressions || data.impressions === 0) return 0;
        return (data.engagements / data.impressions) * 100;
      },
    },
    click_through_rate: {
      id: "click_through_rate",
      label: "Click-Through Rate",
      dependencies: ["clicks", "impressions"],
      calculate: (data) => {
        if (!data.impressions || data.impressions === 0) return 0;
        return (data.clicks / data.impressions) * 100;
      },
    },
  },
  instagram: {
    engagements: {
      id: "engagements",
      label: "Engagements",
      dependencies: ["likes", "comments", "saves"],
      calculate: (data) => {
        return (data.likes || 0) + (data.comments || 0) + (data.saves || 0);
      },
    },
    engagement_rate: {
      id: "engagement_rate",
      label: "Engagement Rate",
      dependencies: ["engagements", "impressions"],
      calculate: (data) => {
        if (!data.impressions || data.impressions === 0) return 0;
        return (data.engagements / data.impressions) * 100;
      },
    },
  },
  linkedin: {
    engagements: {
      id: "engagements",
      label: "Engagements",
      dependencies: ["likes", "comments", "shares"],
      calculate: (data) => {
        return (data.likes || 0) + (data.comments || 0) + (data.shares || 0);
      },
    },
    engagement_rate: {
      id: "engagement_rate",
      label: "Engagement Rate",
      dependencies: ["engagements", "impressions"],
      calculate: (data) => {
        if (!data.impressions || data.impressions === 0) return 0;
        return (data.engagements / data.impressions) * 100;
      },
    },
  },
  twitter: {
    engagements: {
      id: "engagements",
      label: "Engagements",
      dependencies: ["likes", "retweets", "replies"],
      calculate: (data) => {
        return (data.likes || 0) + (data.retweets || 0) + (data.replies || 0);
      },
    },
    engagement_rate: {
      id: "engagement_rate",
      label: "Engagement Rate",
      dependencies: ["engagements", "impressions"],
      calculate: (data) => {
        if (!data.impressions || data.impressions === 0) return 0;
        return (data.engagements / data.impressions) * 100;
      },
    },
  },
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
  const [warningMessage, setWarningMessage] = useState(null);
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
      const apiMetrics = getMetricsWithDependencies(
        selectedMetrics,
        selectedNetworkType
      );

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
  const getMetricsWithDependencies = (selectedMetrics, networkType) => {
    if (!selectedMetrics || selectedMetrics.length === 0) {
      return [];
    }

    // Create a Set to track all metrics including dependencies
    const allMetrics = new Set(selectedMetrics);

    // Add dependencies for calculated metrics
    selectedMetrics.forEach((metric) => {
      // Check if this is a calculated metric
      const calculatedMetric = CALCULATED_METRICS[networkType]?.[metric];
      if (calculatedMetric && calculatedMetric.dependencies) {
        calculatedMetric.dependencies.forEach((dep) => allMetrics.add(dep));
      }
    });

    // Convert Set back to array
    return Array.from(allMetrics);
  };

  /**
   * Export analytics data to Excel
   * @param {Array} data - The data to export
   */
  const exportToExcel = async (data) => {
    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();

      // Group data by profile
      const profilesData = {};
      data.forEach((row) => {
        const profileId = row.profile_id;
        if (!profilesData[profileId]) {
          profilesData[profileId] = [];
        }
        profilesData[profileId].push(row);
      });

      // Process each profile's data
      for (const [profileId, profileRows] of Object.entries(profilesData)) {
        // Sort rows by date
        profileRows.sort((a, b) => new Date(a.Date) - new Date(b.Date));

        // Get the network type and profile name
        const networkType = profileRows[0].Network;
        const profileName = profileRows[0]["Profile Name"];
        let sheetName = `${profileName || "Unknown Profile"} (${
          NETWORK_DISPLAY_NAMES[networkType] || networkType
        })`;
        let originalSheetName = sheetName;
        let counter = 1;

        // Check if sheet name already exists and add counter if needed
        while (workbook.getWorksheet(sheetName)) {
          sheetName = `${originalSheetName} (${counter})`;
          counter++;
        }

        const sheet = workbook.addWorksheet(sheetName);

        // Get all available metrics for this network
        const availableMetrics = new Set();
        profileRows.forEach((row) => {
          Object.keys(row).forEach((key) => {
            if (
              !["Date", "Network", "profile_id", "Profile Name"].includes(key)
            ) {
              availableMetrics.add(key);
            }
          });
        });

        // Add headers
        const headers = ["Date", ...Array.from(availableMetrics)];
        sheet.addRow(headers);

        // Add data rows
        profileRows.forEach((row) => {
          const dataRow = [row.Date];
          headers.slice(1).forEach((metric) => {
            dataRow.push(row[metric] || 0);
          });
          sheet.addRow(dataRow);
        });

        // Calculate totals and add them at the bottom
        const totalRow = ["Total"];
        const totals = {};
        
        // First, calculate totals for all raw metrics (non-calculated)
        headers.slice(1).forEach((metric) => {
          const values = profileRows.map((row) => row[metric] || 0);
          const total = values.reduce((sum, val) => sum + val, 0);
          totals[metric] = total;
          totalRow.push(total);
        });
        sheet.addRow(totalRow);

        // Add last value row
        const lastRow = ["Last Value"];
        headers.slice(1).forEach((metric) => {
          const lastValue = profileRows[profileRows.length - 1][metric] || 0;
          lastRow.push(lastValue);
        });
        sheet.addRow(lastRow);

        // Calculate and add rate metrics for all networks
        sheet.addRow([]); // Add empty row for separation
        sheet.addRow(["Calculated Metrics (Based on Totals)"]);

        // Add headers for calculated metrics
        const rateHeaders = ["Metric", "Value"];
        sheet.addRow(rateHeaders);

        // Calculate engagement metrics based on totals for each network type
        if (networkType === "fb_instagram_account" || networkType === "instagram") {
          // Calculate total engagements for Instagram
          const totalEngagements = 
            (totals.likes || 0) + 
            (totals.comments_count || 0) + 
            (totals.shares_count || 0) + 
            (totals.saves || 0);
          
          // Add total engagements row
          sheet.addRow(["Total Engagements", totalEngagements]);
          
          // Calculate engagement rate using totals
          const totalImpressions = totals.impressions || 0;
          if (totalImpressions > 0) {
            const engagementRate = (totalEngagements / totalImpressions) * 100;
            sheet.addRow(["Engagement Rate", `${engagementRate.toFixed(2)}%`]);
          }
        } else if (networkType === "facebook") {
          // Calculate total engagements for Facebook
          const totalEngagements = 
            (totals.reactions || 0) + 
            (totals.comments_count || 0) + 
            (totals.shares_count || 0);
          
          // Add total engagements row
          sheet.addRow(["Total Engagements", totalEngagements]);
          
          // Calculate engagement rate using totals
          const totalImpressions = totals.impressions || 0;
          if (totalImpressions > 0) {
            const engagementRate = (totalEngagements / totalImpressions) * 100;
            sheet.addRow(["Engagement Rate", `${engagementRate.toFixed(2)}%`]);
          }
        } else if (networkType === "linkedin_company") {
          // Calculate total engagements for LinkedIn
          const totalEngagements = 
            (totals.reactions || 0) + 
            (totals.comments_count || 0) + 
            (totals.shares_count || 0) + 
            (totals.clicks || 0);
          
          // Add total engagements row
          sheet.addRow(["Total Engagements", totalEngagements]);
          
          // Calculate engagement rate using totals
          const totalImpressions = totals.impressions || 0;
          if (totalImpressions > 0) {
            const engagementRate = (totalEngagements / totalImpressions) * 100;
            sheet.addRow(["Engagement Rate", `${engagementRate.toFixed(2)}%`]);
          }
        } else if (networkType === "twitter") {
          // Calculate total engagements for Twitter
          const totalEngagements = 
            (totals.likes || 0) + 
            (totals.comments_count || 0) + 
            (totals.shares_count || 0) + 
            (totals.post_link_clicks || 0) + 
            (totals.post_content_clicks_other || 0) + 
            (totals.engagements_other || 0);
          
          // Add total engagements row
          sheet.addRow(["Total Engagements", totalEngagements]);
          
          // Calculate engagement rate using totals
          const totalImpressions = totals.impressions || 0;
          if (totalImpressions > 0) {
            const engagementRate = (totalEngagements / totalImpressions) * 100;
            sheet.addRow(["Engagement Rate", `${engagementRate.toFixed(2)}%`]);
          }
        } else if (networkType === "youtube") {
          // Calculate total engagements for YouTube
          const totalEngagements = 
            (totals.likes || 0) + 
            (totals.comments_count || 0) + 
            (totals.shares_count || 0);
          
          // Add total engagements row
          sheet.addRow(["Total Engagements", totalEngagements]);
          
          // Calculate engagement rate using totals
          const totalViews = totals.video_views || 0;
          if (totalViews > 0) {
            const engagementRate = (totalEngagements / totalViews) * 100;
            sheet.addRow(["Engagement Rate", `${engagementRate.toFixed(2)}%`]);
          }
        }

        // Calculate Net Follower Growth Percentage
        const currentFollowers = totals["lifetime_snapshot.followers_count"] || 0;
        const netGrowth = totals.net_follower_growth || 0;
        const startFollowers = currentFollowers - netGrowth;
        
        if (startFollowers > 0) {
          const growthPercentage = (netGrowth / startFollowers) * 100;
          sheet.addRow(["Net Follower Growth (%)", `${growthPercentage.toFixed(2)}%`]);
        }

        // Calculate other rate metrics using totals
        const rateMetrics = Object.entries(
          CALCULATED_METRICS[networkType] || {}
        )
          .filter(([_, metric]) => metric.dependencies)
          .map(([id, metric]) => ({
            id,
            ...metric,
          }));

        rateMetrics.forEach((metric) => {
          // Skip metrics we've already calculated above
          if (metric.id === "engagement_rate" || metric.id === "net_follower_growth_percentage") return;
          
          // Use totals for calculating other rate metrics
          const totalValues = {};
          metric.dependencies.forEach((dep) => {
            totalValues[dep] = totals[dep] || 0;
          });
          
          try {
            const rateValue = metric.calculate(totalValues);
            sheet.addRow([metric.label, `${rateValue.toFixed(2)}%`]);
          } catch (error) {
            console.error(`Error calculating ${metric.id}:`, error);
          }
        });
        // Style the worksheet
        sheet.getColumn(1).width = 15; // Date column
        headers.forEach((_, index) => {
          sheet.getColumn(index + 1).width = 15;
        });

        // Style headers
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" },
        };

        // Style total and last value rows
        const totalRowIndex =
          sheet.rowCount -
          (rateMetrics.length > 0 ? rateMetrics.length + 3 : 1);
        const lastRowIndex = totalRowIndex + 1;

        const totalRowStyle = sheet.getRow(totalRowIndex);
        const lastRowStyle = sheet.getRow(lastRowIndex);

        [totalRowStyle, lastRowStyle].forEach((row) => {
          row.font = { bold: true };
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0F0F0" },
          };
        });
      }

      // Generate filename based on date range and format
      const startDateStr = safeFormat(startDate, "yyyy-MM-dd");
      const endDateStr = safeFormat(endDate, "yyyy-MM-dd");
      const formatStr =
        exportFormat.charAt(0).toUpperCase() + exportFormat.slice(1);
      const filename = `Analytics_${formatStr}_${startDateStr}_to_${endDateStr}.xlsx`;

      // Save the workbook
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("Error in exportToExcel:", error);
      throw error;
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
    setWarningMessage(null);

    // If end date is before start date, update end date
    if (endDate && date > endDate) {
      setEndDate(date);
    }

    // If date range exceeds one year, show warning
    if (endDate) {
      const diffTime = Math.abs(endDate.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 365) {
        console.log("Date range exceeds one year. End date will be adjusted.");
        setWarningMessage(
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
    setWarningMessage(null);

    // If start date is after end date, update start date
    if (startDate && date < startDate) {
      setStartDate(date);
    }

    // If date range exceeds one year, show warning
    if (startDate) {
      const diffTime = Math.abs(date.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 365) {
        console.log(
          "Date range exceeds one year. Start date will be adjusted."
        );
        setWarningMessage(
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

  // Validate date range
  const validateDateRange = () => {
    if (!startDate || !endDate) {
      const message = "Please select both start and end dates";
      console.log(message);
      toast.error(message);
      setError(message);
      return false;
    }

    if (startDate.getTime() === endDate.getTime()) {
      const message = "Start and end dates cannot be the same";
      console.log(message);
      toast.error(message);
      setError(message);
      return false;
    }

    // Calculate the difference in days
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      const message =
        "Date range cannot exceed one year. Please select a shorter period.";
      console.log(message);
      toast.error(message);
      setError(message);
      return false;
    }

    return true;
  };

  // Update the handleExportToExcel function to include validation
  const handleExportToExcel = async () => {
    setLoading(true);
    setError(null);
    setWarningMessage(null);
    setAnalyticsData(null); // Clear previous data

    try {
      // Check if any networks are selected
      if (selectedNetworks.length === 0) {
        const message = "Please select at least one network";
        console.log(message);
        toast.error(message);
        setError(message);
        setLoading(false);
        return;
      }

      // Validate date range
      if (!validateDateRange()) {
        setLoading(false);
        return;
      }

      // Validate inputs
      if (selectedProfiles.length === 0) {
        const message = "Please select at least one profile";
        console.log(message);
        toast.error(message);
        setError(message);
        setLoading(false);
        return;
      }

      // Check if any metrics are selected
      const hasSelectedMetrics = Object.values(selectedMetricsByNetwork).some(
        (metrics) => metrics && metrics.length > 0
      );

      if (!hasSelectedMetrics) {
        const message = "Please select at least one metric for export";
        console.log(message);
        toast.error(message);
        setError(message);
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

        // Get the correct metrics key for this network type
        let metricsKey = networkType;
        if (networkType === "facebook" || networkType === "fb_page") {
          metricsKey = "facebook";
        }

        // Get the selected metrics for this network
        const selectedMetrics = selectedMetricsByNetwork[metricsKey] || [];

        // Get the selected metrics with all dependencies for calculated metrics
        const apiMetrics = getMetricsWithDependencies(
          selectedMetrics,
          networkType
        );

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
            `Making API call for ${networkType} with ${profileIds.length} profiles and ${apiMetrics.length} metrics`
          );
          const response = await getProfileAnalytics(apiParams);

          if (!response) {
            const message = `No response for ${networkType}, skipping`;
            console.warn(message);
            toast.error(
              `No data available for ${
                NETWORK_DISPLAY_NAMES[networkType] || networkType
              }`
            );
            setWarningMessage(
              `No data available for ${
                NETWORK_DISPLAY_NAMES[networkType] || networkType
              }`
            );
            continue;
          }

          // Check if response has data
          if (!response.data) {
            const message = `No data in response for ${
              NETWORK_DISPLAY_NAMES[networkType] || networkType
            }`;
            console.log(message);
            toast.error(message);
            setWarningMessage(message);
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

            // Add network information to each row
            processedData.forEach((row) => {
              row.Network = networkType;
              row["Profile Name"] =
                row["Profile Name"] ||
                profilesMap[row.profile_id]?.name ||
                "Unknown Profile";
            });

            allFormattedData.push(...processedData);
          } else {
            const message = `No formatted data available for ${
              NETWORK_DISPLAY_NAMES[networkType] || networkType
            }`;
            console.log(message);
            toast.error(message);
            setWarningMessage(message);
          }
        } catch (error) {
          const message = `Error processing data for ${
            NETWORK_DISPLAY_NAMES[networkType] || networkType
          }: ${error.message}`;
          console.error(`Error processing ${networkType}:`, error);
          console.log(message);
          toast.error(message);
          setWarningMessage(message);
          // Continue with other networks even if one fails
        }
      }

      // Check if we have any data to export
      if (allFormattedData.length === 0) {
        const message =
          "No data available to export. Please check your selections and try again.";
        console.log(message);
        toast.error(message);
        setError(message);
        setLoading(false);
        return;
      }

      // Export the collected data
      await exportToExcel(allFormattedData);
      const successMessage = "Data exported successfully!";
      console.log(successMessage);
      toast.success(successMessage);
      setWarningMessage(successMessage);
    } catch (error) {
      const message = `Error exporting data: ${error.message}`;
      console.error("Error in handleExportToExcel:", error);
      console.log(message);
      toast.error(message);
      setError(message);
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
                                  (profile) => profile.customer_profile_id === id
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
      <div className="flex flex-col items-end">
        {error && (
          <div className="mb-2 p-2 bg-red-100 text-red-700 rounded-md w-full">
            {error}
          </div>
        )}
        {warningMessage && !error && (
          <div className="mb-2 p-2 bg-yellow-100 text-yellow-700 rounded-md w-full">
            {warningMessage}
          </div>
        )}
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
