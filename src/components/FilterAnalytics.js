import { useState, useEffect } from "react";
import { getAnalyticsWithFilters } from "@/api/analytics";
import { Card, CardContent } from "@/components/ui/card";

/**
 * FilterAnalytics component that uses filter-based queries
 */
export default function FilterAnalytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileId, setProfileId] = useState("6886943");
  const [startDate, setStartDate] = useState("2023-03-01");
  const [endDate, setEndDate] = useState("2023-03-31");
  const [metrics, setMetrics] = useState(["impressions", "reactions"]);

  const fetchData = async () => {
    if (!profileId || !startDate || !endDate || metrics.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create filters in the proper format
      const filters = [
        `customer_profile_id.eq(${profileId})`,
        `reporting_period.in(${startDate}...${endDate})`,
      ];

      // Make the analytics request
      const response = await getAnalyticsWithFilters({
        filters,
        metrics,
        page: 1,
      });

      setAnalyticsData(response);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to fetch analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Filter-Based Analytics</h1>
      <div className="mb-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={fetchData}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Data"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {analyticsData && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="text-xl font-bold mb-2">Results</h2>
            <p className="mb-2">
              <span className="font-semibold">Profile ID:</span> {profileId}
            </p>
            <p className="mb-2">
              <span className="font-semibold">Date Range:</span> {startDate} to{" "}
              {endDate}
            </p>
            <p className="mb-4">
              <span className="font-semibold">Metrics:</span>{" "}
              {metrics.join(", ")}
            </p>

            <h3 className="text-lg font-semibold mb-2">Data Points</h3>
            <div className="overflow-auto max-h-96">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 bg-gray-100 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="py-2 px-4 bg-gray-100 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Network
                    </th>
                    {metrics.map((metric) => (
                      <th
                        key={metric}
                        className="py-2 px-4 bg-gray-100 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                      >
                        {metric}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.data[0]?.data_points.map((point, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    >
                      <td className="py-2 px-4 border-b border-gray-200">
                        {point.date}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200">
                        {point.network}
                      </td>
                      {metrics.map((metric) => (
                        <td
                          key={metric}
                          className="py-2 px-4 border-b border-gray-200"
                        >
                          {point.metrics[metric]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
