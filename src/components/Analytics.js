import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { getProfileAnalytics } from "@/api/analytics";
import { getNetworkFormatter } from "@/utils/analyticsFormatters";

const NETWORK_METRICS = {
  threads: [
    {
      id: "lifetime_snapshot.followers_by_age_gender",
      label: "Followers by age/gender",
    },
    { id: "lifetime_snapshot.followers_by_city", label: "Followers by city" },
    {
      id: "lifetime_snapshot.followers_by_country",
      label: "Followers by country",
    },
    { id: "likes", label: "Likes" },
    { id: "profile_views", label: "Profile views" },
    { id: "quotes_count", label: "Quotes" },
    { id: "comments_count", label: "Replies" },
    { id: "reposts_count", label: "Reposts" },
    { id: "shares_count", label: "Shares" },
  ],
  tiktok: [
    { id: "comments_count_total", label: "Comments" },
    {
      id: "lifetime_snapshot.followers_by_country",
      label: "Followers by country",
    },
    {
      id: "lifetime_snapshot.followers_by_gender",
      label: "Followers by gender",
    },
    { id: "lifetime_snapshot.followers_count", label: "Followers count" },
    { id: "lifetime_snapshot.followers_online", label: "Followers online" },
    { id: "likes_total", label: "Likes" },
    { id: "net_follower_growth", label: "Net follower growth" },
    { id: "posts_sent_by_post_type", label: "Posts by type" },
    { id: "posts_sent_count", label: "Posts count" },
    { id: "profile_views_total", label: "Profile views" },
    { id: "shares_count_total", label: "Shares" },
    { id: "video_views_total", label: "Video views" },
  ],
  linkedin_company: [
    { id: "lifetime_snapshot.followers_count", label: "Followers count" },
    { id: "net_follower_growth", label: "Net follower growth" },
    { id: "followers_gained", label: "Followers gained" },
    { id: "followers_gained_organic", label: "Organic followers gained" },
    { id: "followers_gained_paid", label: "Paid followers gained" },
    { id: "followers_lost", label: "Followers lost" },
    { id: "lifetime_snapshot.fans_count", label: "Fans count" },
    { id: "fans_gained", label: "Page likes" },
    { id: "fans_gained_organic", label: "Organic page likes" },
    { id: "fans_gained_paid", label: "Paid page likes" },
    { id: "fans_lost", label: "Page unlikes" },
    { id: "impressions", label: "Impressions" },
    { id: "impressions_organic", label: "Organic impressions" },
    { id: "impressions_viral", label: "Viral impressions" },
    { id: "impressions_nonviral", label: "Non-viral impressions" },
    { id: "impressions_paid", label: "Paid impressions" },
    { id: "impressions_unique", label: "Unique impressions" },
    { id: "post_content_clicks", label: "Content clicks" },
    { id: "reactions", label: "Reactions" },
    { id: "comments_count", label: "Comments" },
    { id: "shares_count", label: "Shares" },
    { id: "posts_sent_count", label: "Posts sent" },
    { id: "posts_sent_by_content_type", label: "Posts by content type" },
    { id: "posts_sent_by_post_type", label: "Posts by post type" },
    { id: "followers_by_job_function", label: "Followers by job function" },
    { id: "followers_by_seniority", label: "Followers by seniority" },
  ],
  twitter: [
    { id: "lifetime_snapshot.followers_count", label: "Followers count" },
    { id: "net_follower_growth", label: "Net follower growth" },
    { id: "impressions", label: "Impressions" },
    { id: "post_media_views", label: "Media views" },
    { id: "video_views", label: "Video views" },
    { id: "reactions", label: "Reactions" },
    { id: "likes", label: "Likes" },
    { id: "comments_count", label: "@Replies" },
    { id: "shares_count", label: "Reposts" },
  ],
  facebook: [
    { id: "lifetime_snapshot.followers_count", label: "Followers count" },
    { id: "net_follower_growth", label: "Net follower growth" },
    { id: "followers_gained", label: "Followers gained" },
    { id: "followers_gained_organic", label: "Organic followers gained" },
    { id: "followers_gained_paid", label: "Paid followers gained" },
    { id: "followers_lost", label: "Followers lost" },
    { id: "lifetime_snapshot.fans_count", label: "Fans count" },
    { id: "fans_gained", label: "Page likes" },
    { id: "fans_gained_organic", label: "Organic page likes" },
    { id: "fans_gained_paid", label: "Paid page likes" },
    { id: "fans_lost", label: "Page unlikes" },
    { id: "impressions", label: "Impressions" },
    { id: "impressions_organic", label: "Organic impressions" },
    { id: "impressions_viral", label: "Viral impressions" },
    { id: "impressions_nonviral", label: "Non-viral impressions" },
    { id: "impressions_paid", label: "Paid impressions" },
  ],
  fb_instagram_account: [
    { id: "lifetime_snapshot.followers_count", label: "Total followers" },
    {
      id: "lifetime_snapshot.followers_by_age_gender",
      label: "Demographic breakdown by age/gender",
    },
    {
      id: "lifetime_snapshot.followers_by_city",
      label: "Demographic breakdown by city",
    },
    {
      id: "lifetime_snapshot.followers_by_country",
      label: "Demographic breakdown by country",
    },
    { id: "net_follower_growth", label: "Net change in followers" },
    { id: "followers_gained", label: "New followers gained" },
    { id: "followers_lost", label: "Followers lost" },
    { id: "lifetime_snapshot.following_count", label: "Accounts following" },
    { id: "net_following_growth", label: "Net change in following count" },
    { id: "impressions", label: "Total impressions" },
    { id: "impressions_unique", label: "Reach (unique viewers)" },
    { id: "video_views", label: "Video views" },
    { id: "reactions", label: "All reactions" },
    { id: "likes", label: "Likes" },
    { id: "comments_count", label: "Comments" },
    { id: "saves", label: "Content saves" },
    { id: "shares_count", label: "Content shares" },
    { id: "story_replies", label: "Replies to stories" },
    { id: "posts_sent_count", label: "Number of posts sent" },
    { id: "posts_sent_by_post_type", label: "Posts by type" },
    { id: "posts_sent_by_content_type", label: "Posts by content category" },
  ],
  youtube: [
    { id: "lifetime_snapshot.subscribers_count", label: "Subscribers count" },
    { id: "net_subscriber_growth", label: "Net subscriber growth" },
    { id: "subscribers_gained", label: "Subscribers gained" },
    { id: "subscribers_lost", label: "Subscribers lost" },
    { id: "video_views", label: "Video views" },
    { id: "watch_time", label: "Watch time" },
    { id: "likes", label: "Likes" },
    { id: "comments_count", label: "Comments" },
    { id: "shares_count", label: "Shares" },
  ],
};

export default function Analytics({ profiles, customerId }) {
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });
  const [loading, setLoading] = useState(false);
  const [availableNetworks, setAvailableNetworks] = useState([]);

  useEffect(() => {
    console.log("Profiles received in Analytics:", profiles);

    if (profiles && Array.isArray(profiles) && profiles.length > 0) {
      // Extract unique networks from profiles using network_type
      const networks = [
        ...new Set(
          profiles
            .filter((profile) => profile && profile.network_type)
            .map((profile) => profile.network_type)
        ),
      ];

      console.log("Extracted networks:", networks);

      if (networks.length > 0) {
        setAvailableNetworks(networks);
        setSelectedNetwork(networks[0]);
      }
    }
  }, [profiles]);

  // When network changes, reset selected metrics
  useEffect(() => {
    if (selectedNetwork && NETWORK_METRICS[selectedNetwork]) {
      // Auto-select all metrics for the selected network
      handleSelectAllMetrics();
    }
  }, [selectedNetwork]);

  const handleNetworkChange = (e) => {
    setSelectedNetwork(e.target.value);
    setSelectedProfiles([]);
    setSelectedMetrics([]);
  };

  const handleProfileToggle = (profileId) => {
    if (selectedProfiles.includes(profileId)) {
      setSelectedProfiles(selectedProfiles.filter((id) => id !== profileId));
    } else {
      setSelectedProfiles([...selectedProfiles, profileId]);
    }
  };

  const handleMetricToggle = (metricId) => {
    if (selectedMetrics.includes(metricId)) {
      setSelectedMetrics(selectedMetrics.filter((id) => id !== metricId));
    } else {
      setSelectedMetrics([...selectedMetrics, metricId]);
    }
  };

  const handleSelectAllMetrics = () => {
    if (selectedNetwork && NETWORK_METRICS[selectedNetwork]) {
      const allMetricIds = NETWORK_METRICS[selectedNetwork].map(
        (metric) => metric.id
      );
      setSelectedMetrics(allMetricIds);
    }
  };

  const handleClearAllMetrics = () => {
    setSelectedMetrics([]);
  };

  // Filter profiles by selected network safely
  const getProfilesByNetwork = () => {
    if (!profiles || !Array.isArray(profiles) || !selectedNetwork) return [];
    return profiles.filter(
      (profile) => profile && profile.network_type === selectedNetwork
    );
  };

  // Get available metrics for the selected network
  const getAvailableMetrics = () => {
    if (!selectedNetwork || !NETWORK_METRICS[selectedNetwork]) return [];
    return NETWORK_METRICS[selectedNetwork];
  };

  // Function to flatten nested objects with dot notation
  const flattenObject = (obj, prefix = "") => {
    if (!obj || typeof obj !== "object" || obj === null) return {};

    return Object.keys(obj).reduce((acc, key) => {
      const pre = prefix.length ? `${prefix}.` : "";

      if (
        typeof obj[key] === "object" &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        Object.assign(acc, flattenObject(obj[key], `${pre}${key}`));
      } else {
        acc[`${pre}${key}`] = obj[key];
      }

      return acc;
    }, {});
  };

  // Flatten the data for Excel export
  const flattenData = (data) => {
    if (!data || !Array.isArray(data)) return [];

    return data.map((item) => {
      const flattenedItem = {};

      // Flatten dimensions
      if (item.dimensions) {
        Object.entries(item.dimensions).forEach(([key, value]) => {
          // For date fields, format them nicely
          if (key === "reporting_period.by(day)") {
            flattenedItem["Date"] = value;
          } else {
            flattenedItem[`dimension.${key}`] = value;
          }
        });
      }

      // Flatten metrics - only include selected metrics
      if (item.metrics) {
        Object.entries(item.metrics).forEach(([key, value]) => {
          // Only include metrics that were selected
          if (selectedMetrics.includes(key)) {
            if (value === null) {
              flattenedItem[`metric.${key}`] = null;
            } else if (typeof value === "object" && !Array.isArray(value)) {
              // Handle nested objects like posts_sent_by_post_type
              const flattened = flattenObject(value);
              Object.entries(flattened).forEach(([nestedKey, nestedValue]) => {
                flattenedItem[`metric.${key}.${nestedKey}`] = nestedValue;
              });
            } else if (Array.isArray(value)) {
              // Handle array values
              flattenedItem[`metric.${key}`] = JSON.stringify(value);
            } else {
              flattenedItem[`metric.${key}`] = value;
            }
          }
        });
      }

      return flattenedItem;
    });
  };

  const handleDownload = async () => {
    if (selectedProfiles.length === 0) {
      alert("Please select at least one profile");
      return;
    }

    if (selectedMetrics.length === 0) {
      alert("Please select at least one metric");
      return;
    }

    if (!dateRange.start || !dateRange.end) {
      alert("Please select a date range");
      return;
    }

    setLoading(true);

    try {
      console.log("Fetching analytics for profiles:", selectedProfiles);
      console.log("Selected metrics:", selectedMetrics);

      // Pass the customer_profile_id values and selected metrics to the API
      const response = await getProfileAnalytics(
        customerId,
        selectedProfiles,
        selectedMetrics,
        dateRange.start,
        dateRange.end
      );

      console.log("API Response:", response);

      if (!response || !response.data) {
        throw new Error("Invalid API response format");
      }

      // Get the appropriate formatter for the selected network
      const formatter = getNetworkFormatter(selectedNetwork);

      // Format the data using the network-specific formatter
      const formattedData = formatter(response, selectedMetrics);
      console.log("Formatted data:", formattedData);

      if (formattedData.length === 0) {
        alert("No data available for the selected criteria");
        setLoading(false);
        return;
      }

      // Calculate totals for numeric fields
      const totalsRow = { Date: "TOTAL", "Profile ID": "" };

      // Get all column headers
      const headers = Object.keys(formattedData[0]);

      // Calculate totals for each numeric column
      headers.forEach((header) => {
        if (header !== "Date" && header !== "Profile ID") {
          // Check if this is a numeric column by examining the first non-null value
          const firstNonNullValue = formattedData.find(
            (row) => row[header] !== null
          )?.[header];

          if (typeof firstNonNullValue === "number") {
            // Sum up all numeric values in this column
            totalsRow[header] = formattedData.reduce((sum, row) => {
              return sum + (row[header] !== null ? row[header] : 0);
            }, 0);
          } else if (
            typeof firstNonNullValue === "string" &&
            (firstNonNullValue.startsWith("{") ||
              firstNonNullValue.startsWith("["))
          ) {
            // For JSON strings (objects/arrays), don't calculate totals
            totalsRow[header] = "N/A";
          } else {
            totalsRow[header] = "";
          }
        }
      });

      // Add the totals row to the formatted data
      formattedData.push(totalsRow);

      // Create a new worksheet with the data including totals
      const wsWithTotals = XLSX.utils.json_to_sheet(formattedData);

      // Add some styling to the totals row (bold)
      const lastRowIndex = formattedData.length;
      const range = XLSX.utils.decode_range(wsWithTotals["!ref"]);

      // Add the worksheet to the workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsWithTotals, "Analytics");

      // Generate file name with network type and date range
      XLSX.writeFile(
        wb,
        `analytics_${selectedNetwork}_${dateRange.start}_${dateRange.end}.xlsx`
      );

      setLoading(false);
    } catch (error) {
      console.error("Error downloading analytics:", error);
      alert(`Error: ${error.message || "Failed to download analytics"}`);
      setLoading(false);
    }
  };

  // Add a new function to handle downloading all networks
  const handleDownloadAllNetworks = async () => {
    if (!dateRange.start || !dateRange.end) {
      alert("Please select a date range");
      return;
    }

    setLoading(true);

    try {
      // Create a workbook for all networks and profiles
      const wb = XLSX.utils.book_new();

      // Process each profile
      for (const profile of profiles) {
        if (!profile || !profile.customer_profile_id || !profile.network_type) {
          console.log("Skipping invalid profile:", profile);
          continue;
        }

        const profileId = profile.customer_profile_id;
        const networkType = profile.network_type;
        const profileName = profile.name || `Profile ${profileId}`;

        console.log(`Processing profile: ${profileName} (${networkType})`);

        // Get metrics for this network
        const networkMetrics = NETWORK_METRICS[networkType] || [];

        if (networkMetrics.length === 0) {
          console.log(`No metrics available for network: ${networkType}`);
          continue;
        }

        // Get metric IDs for this network
        const metricIds = networkMetrics.map((metric) => metric.id);

        // Fetch data for this profile
        const response = await getProfileAnalytics(
          customerId,
          [profileId], // Just this single profile
          metricIds,
          dateRange.start,
          dateRange.end
        );

        console.log(`API Response for ${profileName}:`, response);

        if (!response || !response.data || response.data.length === 0) {
          console.log(`No data available for profile: ${profileName}`);
          continue;
        }

        // Get the formatter for this network
        const formatter = getNetworkFormatter(networkType);

        // Format the data
        const formattedData = formatter(response, metricIds);

        if (formattedData.length === 0) {
          console.log(
            `No formatted data available for profile: ${profileName}`
          );
          continue;
        }

        // Calculate totals for numeric fields
        const totalsRow = { Date: "TOTAL", "Profile ID": "" };

        // Get all column headers
        const headers = Object.keys(formattedData[0]);

        // Calculate totals for each numeric column
        headers.forEach((header) => {
          if (header !== "Date" && header !== "Profile ID") {
            // Check if this is a numeric column by examining the first non-null value
            const firstNonNullValue = formattedData.find(
              (row) => row[header] !== null
            )?.[header];

            if (typeof firstNonNullValue === "number") {
              // Sum up all numeric values in this column
              totalsRow[header] = formattedData.reduce((sum, row) => {
                return sum + (row[header] !== null ? row[header] : 0);
              }, 0);
            } else if (
              typeof firstNonNullValue === "string" &&
              (firstNonNullValue.startsWith("{") ||
                firstNonNullValue.startsWith("["))
            ) {
              // For JSON strings (objects/arrays), don't calculate totals
              totalsRow[header] = "N/A";
            } else {
              totalsRow[header] = "";
            }
          }
        });

        // Add the totals row to the formatted data
        formattedData.push(totalsRow);

        // Create a worksheet for this profile
        const ws = XLSX.utils.json_to_sheet(formattedData);

        // Create a sheet name that's valid for Excel (max 31 chars, no special chars)
        let sheetName = `${profileName} (${networkType})`;
        sheetName = sheetName.replace(/[\\\/\*\?\[\]]/g, "_"); // Replace invalid chars
        sheetName = sheetName.substring(0, 31); // Truncate to 31 chars

        // Make sure sheet name is unique
        let uniqueSheetName = sheetName;
        let counter = 1;
        while (wb.SheetNames.includes(uniqueSheetName)) {
          uniqueSheetName = sheetName.substring(0, 27) + `_${counter}`;
          counter++;
        }

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, uniqueSheetName);
      }

      // Check if any sheets were added
      if (wb.SheetNames.length === 0) {
        throw new Error("No data available for any profile");
      }

      // Generate file name with date range
      XLSX.writeFile(
        wb,
        `analytics_all_profiles_${dateRange.start}_${dateRange.end}.xlsx`
      );

      setLoading(false);
    } catch (error) {
      console.error("Error downloading analytics:", error);
      alert(`Error: ${error.message || "Failed to download analytics"}`);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        Download Analytics
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Network
          </label>
          <select
            value={selectedNetwork}
            onChange={handleNetworkChange}
            className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
          >
            {availableNetworks.length === 0 ? (
              <option value="">No networks available</option>
            ) : (
              availableNetworks.map((network) => (
                <option key={network} value={network}>
                  {network ? network.replace(/_/g, " ").toUpperCase() : ""}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selected Profiles
          </label>
          <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 bg-gray-50">
            {getProfilesByNetwork().length > 0 ? (
              getProfilesByNetwork().map((profile) => (
                <div
                  key={profile.customer_profile_id}
                  className="flex items-center mb-1"
                >
                  <input
                    type="checkbox"
                    id={`profile-${profile.customer_profile_id}`}
                    checked={selectedProfiles.includes(
                      profile.customer_profile_id
                    )}
                    onChange={() =>
                      handleProfileToggle(profile.customer_profile_id)
                    }
                    className="mr-2"
                  />
                  <label
                    htmlFor={`profile-${profile.customer_profile_id}`}
                    className="text-gray-800"
                  >
                    {profile.name || `Profile ${profile.customer_profile_id}`}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">
                No profiles available for this network
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Select Metrics
            </label>
            <div className="space-x-2">
              <button
                onClick={handleSelectAllMetrics}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Select All
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={handleClearAllMetrics}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear All
              </button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 bg-gray-50">
            {getAvailableMetrics().length > 0 ? (
              getAvailableMetrics().map((metric) => (
                <div key={metric.id} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={`metric-${metric.id}`}
                    checked={selectedMetrics.includes(metric.id)}
                    onChange={() => handleMetricToggle(metric.id)}
                    className="mr-2"
                  />
                  <label
                    htmlFor={`metric-${metric.id}`}
                    className="text-gray-800"
                  >
                    {metric.label}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">
                No metrics available for this network
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
            />
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Download Selected Network"}
          </button>

          <button
            onClick={handleDownloadAllNetworks}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Download All Networks"}
          </button>
        </div>
      </div>
    </div>
  );
}
