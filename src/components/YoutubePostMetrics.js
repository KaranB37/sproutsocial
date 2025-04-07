import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { getYoutubePostMetrics, getProfileAnalytics } from "@/api/analytics";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2, DownloadCloud, Table, BarChart2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";
import {
  extractCustomerId,
  calculateDerivedYouTubeMetrics,
} from "@/utils/profileHelpers";

/**
 * Apply formatting to summary rows (totals and averages)
 * @param {Object} worksheet - XLSX worksheet
 * @param {Array} specialRows - Array of row indices that need special formatting (1-based)
 * @param {Object} options - Formatting options
 */
const formatSummaryRows = (worksheet, specialRows, options = {}) => {
  if (!worksheet || !specialRows || !specialRows.length) return;

  // Get the range of the worksheet
  const range = XLSX.utils.decode_range(worksheet["!ref"]);

  // Format each special row
  specialRows.forEach((rowIndex, idx) => {
    // Skip invalid row indices
    if (!rowIndex || rowIndex <= 0) return;

    const isTotal = idx === specialRows.length - 1; // Last row is always the total
    const bgColor = isTotal ? "EFEFEF" : "F5F5F5"; // Darker bg for totals

    // Format each cell in the row
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex - 1, c: col });

      // Create cell if it doesn't exist
      if (!worksheet[cellRef]) {
        worksheet[cellRef] = { t: "s", v: "" };
      }

      // Apply formatting
      if (!worksheet[cellRef].s) worksheet[cellRef].s = {};
      worksheet[cellRef].s.font = { bold: isTotal };
      worksheet[cellRef].s.fill = {
        bgColor: { rgb: bgColor },
        fgColor: { rgb: bgColor },
      };

      // Add border to top of cell
      worksheet[cellRef].s.border = {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
      };
    }
  });
};

const YoutubePostMetrics = ({ profile, customerId }) => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportOption, setExportOption] = useState("both"); // "both", "post", "normal"

  // Log profile info when component mounts
  useEffect(() => {
    console.log(
      "YoutubePostMetrics - Component mounted with profile:",
      profile
    );

    if (!profile) {
      console.error("YoutubePostMetrics - No profile provided");
    } else if (!profile.customer_profile_id) {
      console.error(
        "YoutubePostMetrics - Profile missing customer_profile_id:",
        profile
      );
    } else {
      // Extract customer ID and log it
      const extractedId = extractCustomerId(profile.customer_profile_id);
      console.log(
        `Extracted customer ID: ${extractedId} from profile ID: ${profile.customer_profile_id}`
      );

      if (customerId) {
        console.log(`Provided customer ID: ${customerId}`);
        if (extractedId !== customerId) {
          console.warn(
            `Warning: Extracted customer ID (${extractedId}) doesn't match provided ID (${customerId})`
          );
        }
      }
    }
  }, [profile, customerId]);

  const handleExportToExcel = async () => {
    // Debug profile object
    console.log("Export clicked with profile:", profile);

    if (!profile || !profile.customer_profile_id) {
      const errorMsg = "Invalid profile - missing customer_profile_id";
      console.error(errorMsg, profile);
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Format dates for API
      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(endDate, "yyyy-MM-dd");

      let postMetricsData = null;
      let normalMetricsData = null;
      let fileName = `YouTube_Metrics_${
        profile.name || "Profile"
      }_${formattedStartDate}_to_${formattedEndDate}.xlsx`;
      const wb = XLSX.utils.book_new();

      // Fetch post metrics if needed
      if (exportOption === "post" || exportOption === "both") {
        console.log(
          `Fetching YouTube post metrics for profile ID: ${profile.customer_profile_id}, customerId: ${customerId}`
        );

        const postResponse = await getYoutubePostMetrics({
          profileId: profile.customer_profile_id,
          customerId: customerId,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        });

        if (postResponse && postResponse.data && postResponse.data.length > 0) {
          postMetricsData = postResponse.data;
          console.log(
            `Processing ${postMetricsData.length} posts for Excel export`
          );

          // Process post data for Excel
          const postExcelData = postMetricsData.map((post) => {
            // Format created_time
            const createdTime = post.created_time
              ? new Date(post.created_time)
              : null;
            const formattedDate = createdTime
              ? format(createdTime, "yyyy-MM-dd HH:mm:ss")
              : "";

            // Extract metrics
            const metrics = post.metrics || {};

            // Get post text (truncate if too long)
            const postText = post.text || "";
            const truncatedText =
              postText.length > 250
                ? postText.substring(0, 250) + "..."
                : postText;

            // Get base metrics
            const videoViews = metrics["lifetime.video_views"] || 0;
            const likes = metrics["lifetime.likes"] || 0;
            const dislikes = metrics["lifetime.dislikes"] || 0;
            const comments = metrics["lifetime.comments_count"] || 0;
            const shares = metrics["lifetime.shares_count"] || 0;
            const subscribersGained =
              metrics["lifetime.subscribers_gained"] || 0;
            const subscribersLost = metrics["lifetime.subscribers_lost"] || 0;
            const annotationClicks = metrics["lifetime.annotation_clicks"] || 0;
            const cardClicks = metrics["lifetime.card_clicks"] || 0;
            const redVideoViews = metrics["lifetime.red_video_views"] || 0;
            const estMinutesWatched =
              metrics["lifetime.estimated_minutes_watched"] || 0;
            const estRedMinutesWatched =
              metrics["lifetime.estimated_red_minutes_watched"] || 0;
            const impressions = metrics["lifetime.impressions"] || 0;

            // Calculate derived metrics
            const {
              contentClickOther,
              videoReactions,
              videoEngagements,
              videoEngagementsPerView,
            } = calculateDerivedYouTubeMetrics(metrics, true);

            // Construct row data
            return {
              Date: formattedDate,
              Post: truncatedText,
              Link: post.perma_link || "",
              "Video Views": videoViews,
              "Red Video Views": redVideoViews,
              "Estimated Minutes Watched": estMinutesWatched,
              "Estimated Red Minutes Watched": estRedMinutesWatched,
              Likes: likes,
              Dislikes: dislikes,
              "Video Reactions": videoReactions,
              Comments: comments,
              Shares: shares,
              "Subscribers Gained": subscribersGained,
              "Subscribers Lost": subscribersLost,
              Impressions: impressions,
              "Annotation Clicks": annotationClicks,
              "Card Clicks": cardClicks,
              "Content Click Other": contentClickOther,
              "Video Engagements": videoEngagements,
              "Video Engagements Per View": videoEngagementsPerView.toFixed(4),
            };
          });

          // Calculate totals for numeric metrics
          const totalRow = {
            Date: "TOTAL",
            Post: `${postExcelData.length} posts`,
            Link: "",
          };

          // Calculate sums for all numeric metrics
          let totalVideoViews = 0;
          let totalVideoEngagements = 0;

          postExcelData.forEach((row) => {
            Object.keys(row).forEach((key) => {
              // Skip non-numeric or non-summable fields
              if (
                key === "Date" ||
                key === "Post" ||
                key === "Link" ||
                key === "Video Engagements Per View"
              )
                return;

              // Convert to number and add to total
              const value =
                typeof row[key] === "number"
                  ? row[key]
                  : parseFloat(row[key]) || 0;
              totalRow[key] = (totalRow[key] || 0) + value;

              // Track specific values for additional calculations
              if (key === "Video Views") totalVideoViews += value;
              if (key === "Video Engagements") totalVideoEngagements += value;
            });
          });

          // Format Video Engagements Per View for the total row (total engagements / total views)
          if (totalRow["Video Views"] > 0) {
            totalRow["Video Engagements Per View"] = (
              totalRow["Video Engagements"] / totalRow["Video Views"]
            ).toFixed(4);
          } else {
            totalRow["Video Engagements Per View"] = "0.0000";
          }

          // Add average row if there are multiple posts
          if (postExcelData.length > 1) {
            const avgRow = {
              Date: "AVERAGE",
              Post: "",
              Link: "",
            };

            // Calculate averages for all numeric metrics
            Object.keys(totalRow).forEach((key) => {
              // Skip non-numeric or non-averageable fields
              if (key === "Date" || key === "Post" || key === "Link") return;

              // For Video Engagements Per View, calculate directly
              if (key === "Video Engagements Per View") {
                avgRow[key] =
                  totalVideoViews > 0
                    ? (totalVideoEngagements / totalVideoViews).toFixed(4)
                    : "0.0000";
                return;
              }

              // Calculate average
              avgRow[key] = totalRow[key] / postExcelData.length;

              // Format numbers to keep them clean
              if (typeof avgRow[key] === "number") {
                // Keep decimal places only if needed
                if (avgRow[key] % 1 === 0) {
                  avgRow[key] = Math.round(avgRow[key]);
                } else {
                  avgRow[key] = avgRow[key].toFixed(2);
                }
              }
            });

            // Add average row before total row
            postExcelData.push(avgRow);
          }

          // Add total row to data
          postExcelData.push(totalRow);

          // Add post metrics sheet
          const postWs = XLSX.utils.json_to_sheet(postExcelData);

          // Apply formatting to summary rows
          try {
            // Get the special row indices - AVERAGE and TOTAL rows
            const specialRows = [];

            // If we have multiple posts and added an average row
            if (postExcelData.length > 3) {
              // Last two rows are AVERAGE and TOTAL
              specialRows.push(postExcelData.length - 1); // Average row
              specialRows.push(postExcelData.length); // Total row
            } else {
              // Just the total row
              specialRows.push(postExcelData.length);
            }

            formatSummaryRows(postWs, specialRows);
          } catch (e) {
            console.warn("Error formatting post metrics summary rows:", e);
          }

          XLSX.utils.book_append_sheet(wb, postWs, "YouTube Post Metrics");
        } else {
          console.warn("No post metrics data found");
          if (exportOption === "post") {
            throw new Error(
              "No post metrics data available for selected date range"
            );
          }
        }
      }

      // Fetch normal metrics if needed
      if (exportOption === "normal" || exportOption === "both") {
        if (!customerId) {
          throw new Error("Missing customer ID for normal metrics");
        }

        console.log(
          `Fetching normal YouTube metrics for customer ID: ${customerId}, profile ID: ${profile.customer_profile_id}`
        );

        // Define YouTube metrics to fetch
        const youtubeMetrics = [
          "lifetime_snapshot.followers_count",
          "net_follower_growth",
          "followers_gained",
          "followers_lost",
          "likes",
          "video_views",
          "impressions",
          "comments_count",
          "shares_count",
          "posts_sent_count",
        ];

        const normalResponse = await getProfileAnalytics({
          customerId,
          profileId: profile.customer_profile_id,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          reportingPeriod: "daily",
          metrics: youtubeMetrics,
        });

        if (
          normalResponse &&
          normalResponse.data &&
          normalResponse.data.length > 0
        ) {
          normalMetricsData = normalResponse.data;
          console.log(
            `Processing ${normalMetricsData.length} days of normal metrics`
          );

          // Process normal metrics for Excel
          const normalExcelData = normalMetricsData.map((item) => {
            // Format the date
            let reportDate = "";
            try {
              reportDate = item.reporting_period
                ? format(new Date(item.reporting_period), "yyyy-MM-dd")
                : "";
            } catch (e) {
              console.error("Error formatting date:", e);
            }

            const metrics = item.metrics || {};

            // Calculate derived metrics using our utility function
            const {
              contentClickOther,
              videoReactions,
              videoEngagements,
              videoEngagementsPerView,
            } = calculateDerivedYouTubeMetrics(metrics, false);

            return {
              Date: reportDate,
              Subscribers: metrics["lifetime_snapshot.followers_count"] || 0,
              "Subscriber Growth": metrics["net_follower_growth"] || 0,
              "Subscribers Gained": metrics["followers_gained"] || 0,
              "Subscribers Lost": metrics["followers_lost"] || 0,
              Likes: metrics["likes"] || 0,
              Dislikes: 0, // Not available in channel metrics
              "Video Reactions": videoReactions,
              "Video Views": metrics["video_views"] || 0,
              Comments: metrics["comments_count"] || 0,
              Shares: metrics["shares_count"] || 0,
              "Videos Published": metrics["posts_sent_count"] || 0,
              "Video Engagements": videoEngagements,
              "Video Engagements Per View": videoEngagementsPerView.toFixed(4),
              "Content Click Other": contentClickOther,
            };
          });

          // Calculate totals for normal metrics
          const normalTotalRow = {
            Date: "TOTAL",
          };

          // Track specific values for additional calculations
          let totalDays = normalExcelData.length;
          let totalVideoViews = 0;
          let totalVideoEngagements = 0;

          // Calculate sums for all numeric metrics except ratios/averages
          normalExcelData.forEach((row) => {
            Object.keys(row).forEach((key) => {
              // Skip non-numeric or calculated fields
              if (key === "Date" || key === "Video Engagements Per View")
                return;

              const value =
                typeof row[key] === "number"
                  ? row[key]
                  : parseFloat(row[key]) || 0;

              // For Subscribers, only take the latest day's count since it's a running total
              if (key === "Subscribers") {
                // If this is the first row or the value is higher than current, update it
                if (!normalTotalRow[key] || value > normalTotalRow[key]) {
                  normalTotalRow[key] = value;
                }
                return;
              }

              // Track specific metrics for calculations
              if (key === "Video Views") totalVideoViews += value;
              if (key === "Video Engagements") totalVideoEngagements += value;

              // Add to totals
              normalTotalRow[key] = (normalTotalRow[key] || 0) + value;
            });
          });

          // Format Video Engagements Per View for the total row
          if (normalTotalRow["Video Views"] > 0) {
            normalTotalRow["Video Engagements Per View"] = (
              normalTotalRow["Video Engagements"] /
              normalTotalRow["Video Views"]
            ).toFixed(4);
          } else {
            normalTotalRow["Video Engagements Per View"] = "0.0000";
          }

          // Add daily average row if we have multiple days
          if (totalDays > 1) {
            const avgRow = {
              Date: "DAILY AVG",
            };

            // Calculate averages for all numeric metrics
            Object.keys(normalTotalRow).forEach((key) => {
              // Skip non-numeric, non-averageable, or subscriber count fields
              if (
                key === "Date" ||
                key === "Video Engagements Per View" ||
                key === "Subscribers"
              )
                return;

              // Calculate average
              avgRow[key] = normalTotalRow[key] / totalDays;

              // Format numbers to keep them clean
              if (typeof avgRow[key] === "number") {
                // Keep decimal places only if needed
                if (avgRow[key] % 1 === 0) {
                  avgRow[key] = Math.round(avgRow[key]);
                } else {
                  avgRow[key] = avgRow[key].toFixed(2);
                }
              }
            });

            // For subscribers, use the same value as total (latest count)
            avgRow["Subscribers"] = normalTotalRow["Subscribers"];

            // Calculate engagement rate directly
            avgRow["Video Engagements Per View"] =
              totalVideoViews > 0
                ? (totalVideoEngagements / totalVideoViews).toFixed(4)
                : "0.0000";

            // Add average row before total row
            normalExcelData.push(avgRow);
          }

          // Add total row to data
          normalExcelData.push(normalTotalRow);

          // Add normal metrics sheet
          const normalWs = XLSX.utils.json_to_sheet(normalExcelData);

          // Apply formatting to summary rows
          try {
            // Get the special row indices - DAILY AVG and TOTAL rows
            const specialRows = [];

            // If we have multiple days and added an average row
            if (normalExcelData.length > 3) {
              // Last two rows are DAILY AVG and TOTAL
              specialRows.push(normalExcelData.length - 1); // Daily avg row
              specialRows.push(normalExcelData.length); // Total row
            } else {
              // Just the total row
              specialRows.push(normalExcelData.length);
            }

            formatSummaryRows(normalWs, specialRows);
          } catch (e) {
            console.warn("Error formatting normal metrics summary rows:", e);
          }

          XLSX.utils.book_append_sheet(wb, normalWs, "YouTube Channel Metrics");
        } else {
          console.warn("No normal metrics data found");
          if (exportOption === "normal") {
            throw new Error(
              "No normal metrics data available for selected date range"
            );
          }
        }
      }

      // Check if we have any data to export
      if (
        (!postMetricsData && !normalMetricsData) ||
        (exportOption === "both" && (!postMetricsData || !normalMetricsData))
      ) {
        throw new Error("No data available for the selected date range");
      }

      console.log("Writing Excel file:", fileName);
      XLSX.writeFile(wb, fileName);
      toast.success("YouTube metrics exported successfully");
    } catch (err) {
      const errorMsg = err.message || "Failed to export data";
      console.error("Error exporting YouTube metrics:", err);
      setError(`Failed to export data: ${errorMsg}`);
      toast.error(`Export failed: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">YouTube Metrics Export</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              maxDate={new Date()}
              className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              minDate={startDate}
              maxDate={new Date()}
              className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Options
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div
              className={`cursor-pointer border rounded p-3 flex flex-col items-center ${
                exportOption === "both"
                  ? "bg-red-50 border-red-300"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setExportOption("both")}
            >
              <Table className="h-6 w-6 mb-1 text-red-600" />
              <span className="text-sm">All Metrics</span>
            </div>
            <div
              className={`cursor-pointer border rounded p-3 flex flex-col items-center ${
                exportOption === "post"
                  ? "bg-red-50 border-red-300"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setExportOption("post")}
            >
              <DownloadCloud className="h-6 w-6 mb-1 text-red-600" />
              <span className="text-sm">Only Post Metrics</span>
            </div>
            <div
              className={`cursor-pointer border rounded p-3 flex flex-col items-center ${
                exportOption === "normal"
                  ? "bg-red-50 border-red-300"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setExportOption("normal")}
            >
              <BarChart2 className="h-6 w-6 mb-1 text-red-600" />
              <span className="text-sm">Only Channel Metrics</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <Button
          onClick={handleExportToExcel}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <DownloadCloud className="mr-2 h-4 w-4" />
              Export YouTube Metrics
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default YoutubePostMetrics;
