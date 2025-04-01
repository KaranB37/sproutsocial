import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { getProfileAnalytics } from "@/api/analytics";
import { getNetworkFormatter } from "@/utils/analyticsFormatters";
import { groupDataByReportingPeriod } from "@/utils/reportingPeriodUtils";
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
    { id: "followers_lost", label: "Followers Lost" },
    { id: "impressions", label: "Impressions" },
    { id: "reach", label: "Reach" },
    { id: "engagement", label: "Engagement" },
    { id: "posts_sent_count", label: "Posts Sent Count" },
  ],
  fb_instagram_account: [
    { id: "lifetime_snapshot.followers_count", label: "Followers" },
    { id: "net_follower_growth", label: "Net Follower Growth" },
    { id: "followers_gained", label: "Followers Gained" },
    { id: "followers_lost", label: "Followers Lost" },
    { id: "impressions", label: "Impressions" },
    { id: "reach", label: "Reach" },
    { id: "profile_views", label: "Profile Views" },
    { id: "website_clicks", label: "Website Clicks" },
    { id: "posts_sent_count", label: "Posts Sent Count" },
  ],
  linkedin_company: [
    { id: "lifetime_snapshot.followers_count", label: "Followers" },
    { id: "net_follower_growth", label: "Net Follower Growth" },
    { id: "followers_gained", label: "Followers Gained" },
    { id: "followers_lost", label: "Followers Lost" },
    { id: "impressions", label: "Impressions" },
    { id: "engagement", label: "Engagement" },
    { id: "clicks", label: "Clicks" },
    { id: "reactions", label: "Reactions" },
    { id: "comments", label: "Comments" },
    { id: "shares", label: "Shares" },
    { id: "posts_sent_count", label: "Posts Sent Count" },
  ],
  youtube: [
    { id: "lifetime_snapshot.followers_count", label: "Subscribers" },
    { id: "net_follower_growth", label: "Net Subscriber Growth" },
    { id: "followers_gained", label: "Subscribers Gained" },
    { id: "followers_lost", label: "Subscribers Lost" },
    { id: "views", label: "Views" },
    { id: "watch_time", label: "Watch Time (hours)" },
    { id: "likes", label: "Likes" },
    { id: "comments", label: "Comments" },
    { id: "shares", label: "Shares" },
    { id: "posts_sent_count", label: "Videos Published" },
  ],
  twitter: [
    { id: "lifetime_snapshot.followers_count", label: "Followers" },
    { id: "net_follower_growth", label: "Net Follower Growth" },
    { id: "followers_gained", label: "Followers Gained" },
    { id: "followers_lost", label: "Followers Lost" },
    { id: "impressions", label: "Impressions" },
    { id: "engagement", label: "Engagement" },
    { id: "url_clicks", label: "URL Clicks" },
    { id: "retweets", label: "Retweets" },
    { id: "replies", label: "Replies" },
    { id: "likes", label: "Likes" },
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
  threads: [
    { id: "lifetime_snapshot.followers_count", label: "Followers" },
    { id: "net_follower_growth", label: "Net Follower Growth" },
    { id: "followers_gained", label: "Followers Gained" },
    { id: "followers_lost", label: "Followers Lost" },
    { id: "impressions", label: "Impressions" },
    { id: "likes", label: "Likes" },
    { id: "reposts", label: "Reposts" },
    { id: "posts_sent_count", label: "Posts Sent Count" },
  ],
};

const Analytics = ({ profiles, customerId }) => {
  // State for form inputs
  const [reportingPeriod, setReportingPeriod] = useState("daily");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedNetworkType, setSelectedNetworkType] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [selectedMetricsByNetwork, setSelectedMetricsByNetwork] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfigPanel, setShowConfigPanel] = useState(true);
  const [selectedNetworks, setSelectedNetworks] = useState([]);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);

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
      const networkMetrics = prev[networkType] || [];

      // Toggle the metric for this specific network
      const updatedNetworkMetrics = networkMetrics.includes(metricId)
        ? networkMetrics.filter((id) => id !== metricId)
        : [...networkMetrics, metricId];

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
  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fix timezone issues by using date strings in local time
      // This ensures selected dates aren't shifted due to timezone conversion
      const formattedStartDate = new Date(startDate);
      const startYear = formattedStartDate.getFullYear();
      const startMonth = String(formattedStartDate.getMonth() + 1).padStart(
        2,
        "0"
      );
      const startDay = String(formattedStartDate.getDate()).padStart(2, "0");
      const startDateStr = `${startYear}-${startMonth}-${startDay}`;

      const formattedEndDate = new Date(endDate);
      const endYear = formattedEndDate.getFullYear();
      const endMonth = String(formattedEndDate.getMonth() + 1).padStart(2, "0");
      const endDay = String(formattedEndDate.getDate()).padStart(2, "0");
      const endDateStr = `${endYear}-${endMonth}-${endDay}`;

      console.log(`Original dates: ${startDate} to ${endDate}`);
      console.log(`Formatted dates: ${startDateStr} to ${endDateStr}`);
      console.log(`Selected reporting period: ${reportingPeriod}`);

      // Collect all selected profiles and their corresponding metrics by network
      const reportData = [];

      // Process each network separately
      for (const networkType of selectedNetworks) {
        const networkProfiles = selectedProfiles.filter((profileId) => {
          const profile = profiles.find(
            (p) => p.customer_profile_id === profileId
          );
          return (
            profile &&
            (profile.network_type === networkType ||
              // Handle Facebook's different network types
              (networkType === "facebook" &&
                (profile.network_type === "fb_page" ||
                  profile.network_type === "facebook")))
          );
        });

        // Skip if no profiles selected for this network
        if (networkProfiles.length === 0) continue;

        // Get the metrics selected for this network
        const networkMetrics = selectedMetricsByNetwork[networkType] || [];

        // Skip if no metrics selected for this network
        if (networkMetrics.length === 0) continue;

        try {
          // Fetch data for this network
          // Always request daily data from the API, we'll aggregate it later based on reportingPeriod
          const response = await getProfileAnalytics({
            customerId,
            profileId: networkProfiles,
            startDate: startDateStr,
            endDate: endDateStr,
            reportingPeriod: "daily", // Always request daily data from API
            metrics: networkMetrics,
          });

          // Check if the response has the expected structure
          if (!response || !response.data) {
            console.error(
              `Invalid response format for ${networkType}:`,
              response
            );
            continue;
          }

          // Format the data using the appropriate formatter
          const formatter = getNetworkFormatter(networkType);
          const formattedData = formatter(response, networkMetrics);

          // Log the formatted data for debugging
          console.log(
            `Formatted data for ${networkType}:`,
            formattedData.length,
            "rows"
          );

          // Aggregate data by reporting period
          const aggregatedData = aggregateDataByPeriod(
            formattedData,
            reportingPeriod
          );

          // Add to the combined report data
          reportData.push(...aggregatedData);
        } catch (networkError) {
          console.error(
            `Error fetching data for ${networkType}:`,
            networkError
          );
          // Continue with other networks even if one fails
        }
      }

      // Group data by network and profile for Excel export
      const dataByNetworkAndProfile = {};

      // Process each data point and organize by network and profile
      reportData.forEach((row) => {
        const network = row.Network;
        const profileId = row.profile_id;

        // Find the profile name
        const profile = profiles.find(
          (p) => p.customer_profile_id === profileId
        );
        const profileName = profile ? profile.name : `Profile ${profileId}`;

        // Create a sheet key in the format "NetworkName-ProfileName"
        const sheetKey = `${network}-${profileName}`;

        // Initialize the array for this network-profile if it doesn't exist
        if (!dataByNetworkAndProfile[sheetKey]) {
          dataByNetworkAndProfile[sheetKey] = [];
        }

        // Add the data row to the appropriate network-profile group
        dataByNetworkAndProfile[sheetKey].push(row);
      });

      // Export the data to Excel with separate sheets for each network-profile
      if (Object.keys(dataByNetworkAndProfile).length > 0) {
        await exportToExcel(dataByNetworkAndProfile);
      } else {
        setError("No data available for the selected criteria");
      }
    } catch (err) {
      console.error("Error generating report:", err);
      setError("Failed to generate report: " + err.message);
    } finally {
      // Always reset loading state when finished, regardless of success or error
      setLoading(false);
    }
  };

  // Update the exportToExcel function to handle the new data structure with separate sheets
  const exportToExcel = async (dataByNetworkAndProfile) => {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Process each network-profile combination
      Object.entries(dataByNetworkAndProfile).forEach(([sheetKey, data]) => {
        if (!data || data.length === 0) return;

        // Apply reporting period aggregation to the data
        const aggregatedData = aggregateDataByPeriod(data, reportingPeriod);

        // Calculate totals for numeric columns
        const totalsRow = { Date: "TOTAL" };

        // Find all numeric columns
        const numericColumns = new Set();
        aggregatedData.forEach((row) => {
          Object.entries(row).forEach(([key, value]) => {
            if (
              key !== "Date" &&
              key !== "Network" &&
              key !== "profile_id" &&
              typeof value === "number" &&
              !isNaN(value)
            ) {
              numericColumns.add(key);
            }
          });
        });

        // Calculate sums for each numeric column
        numericColumns.forEach((column) => {
          totalsRow[column] = aggregatedData.reduce((sum, row) => {
            return sum + (typeof row[column] === "number" ? row[column] : 0);
          }, 0);
        });

        // Remove any existing total row
        const filteredData = aggregatedData.filter(
          (row) => row.Date !== "TOTAL"
        );

        // Create a copy of the data without profile_id for display in Excel
        const displayData = filteredData.map((row) => {
          const { profile_id, ...rest } = row;
          return rest;
        });

        // Add the totals row to the end
        displayData.push(totalsRow);

        // Create a worksheet for this network-profile combination
        const ws = XLSX.utils.json_to_sheet(displayData);

        // Add the worksheet to the workbook with a sheet name based on network and profile
        // Ensure sheet name is valid (max 31 chars, no special chars)
        let sheetName = sheetKey;
        if (sheetName.length > 31) {
          sheetName = sheetName.substring(0, 31);
        }
        // Replace invalid characters with underscore
        sheetName = sheetName.replace(/[*?:\/\\[\]]/g, "_");

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      // Generate a filename with the date range and reporting period
      const startStr = safeFormat(startDate, "yyyy-MM-dd");
      const endStr = safeFormat(endDate, "yyyy-MM-dd");
      const filename = `social_media_analytics_${startStr}_to_${endStr}_${reportingPeriod}.xlsx`;

      // Write the workbook and trigger download
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error("Error exporting to Excel:", err);
      setError("Failed to export data to Excel: " + err.message);
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
          onClick={generateReport}
          disabled={
            loading ||
            selectedProfiles.length === 0 ||
            Object.keys(selectedMetricsByNetwork).length === 0
          }
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <BarChart3 className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </div>

      {selectedProfiles.length === 0 ||
      Object.keys(selectedMetricsByNetwork).length === 0 ? (
        <div className="p-4 mt-4 border border-yellow-200 bg-yellow-50 rounded-md text-yellow-800">
          Please select at least one network and metric
        </div>
      ) : null}

      {error && (
        <div className="p-4 mt-4 border border-red-200 bg-red-50 rounded-md text-red-800">
          {error}
        </div>
      )}
    </div>
  );
};

export default Analytics;
