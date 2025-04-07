/**
 * Utility functions for handling different reporting periods in analytics data
 */

/**
 * Determines the fiscal quarter for a given date
 * @param {Date} date - The date to check
 * @returns {Object} Object containing quarter number and fiscal year
 */
export const getFiscalQuarter = (date) => {
  const month = date.getMonth();
  let quarter, fiscalYear;

  // Fiscal year quarters:
  // Q1: April-June (months 3-5)
  // Q2: July-September (months 6-8)
  // Q3: October-December (months 9-11)
  // Q4: January-March (months 0-2)

  if (month >= 3 && month <= 5) {
    quarter = 1;
    fiscalYear = date.getFullYear();
  } else if (month >= 6 && month <= 8) {
    quarter = 2;
    fiscalYear = date.getFullYear();
  } else if (month >= 9 && month <= 11) {
    quarter = 3;
    fiscalYear = date.getFullYear();
  } else {
    // January-March
    quarter = 4;
    fiscalYear = date.getFullYear() - 1; // Previous fiscal year
  }

  return { quarter, fiscalYear };
};

/**
 * Gets a formatted string representation of a fiscal quarter
 * @param {number} quarter - The quarter number (1-4)
 * @param {number} fiscalYear - The fiscal year
 * @returns {string} Formatted quarter string (e.g., "Q1 (Apr-Jun) FY2025-26")
 */
export const getQuarterLabel = (quarter, fiscalYear) => {
  switch (quarter) {
    case 1:
      return `Q1 (Apr-Jun) FY${fiscalYear}-${String(fiscalYear + 1).slice(-2)}`;
    case 2:
      return `Q2 (Jul-Sep) FY${fiscalYear}-${String(fiscalYear + 1).slice(-2)}`;
    case 3:
      return `Q3 (Oct-Dec) FY${fiscalYear}-${String(fiscalYear + 1).slice(-2)}`;
    case 4:
      return `Q4 (Jan-Mar) FY${fiscalYear}-${String(fiscalYear + 1).slice(-2)}`;
    default:
      return `Unknown Quarter FY${fiscalYear}`;
  }
};

/**
 * Gets a formatted string representation of a month
 * @param {Date} date - The date
 * @returns {string} Formatted month string (e.g., "April 2025")
 */
export const getMonthLabel = (date) => {
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

  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

/**
 * Generate all period keys between start and end dates based on reporting period
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} reportingPeriod - Reporting period (monthly, quarterly, yearly)
 * @returns {Array} Array of period objects with key and label
 */
export const generateAllPeriods = (startDate, endDate, reportingPeriod) => {
  const periods = [];

  // Clone dates to avoid modifying the originals
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  // Ensure dates are valid
  if (isNaN(currentDate.getTime()) || isNaN(end.getTime())) {
    console.warn("Invalid date range for period generation");
    return periods;
  }

  // For monthly reporting
  if (reportingPeriod === "monthly") {
    // Set to first day of month for proper iteration
    currentDate.setDate(1);

    while (currentDate <= end) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const periodKey = `${year}-${String(month + 1).padStart(2, "0")}`;
      const periodLabel = getMonthLabel(currentDate);

      periods.push({ key: periodKey, label: periodLabel });

      // Move to next month
      currentDate.setMonth(month + 1);
    }
  }
  // For quarterly reporting
  else if (reportingPeriod === "quarterly") {
    // Get fiscal quarter info for start date
    const startQuarterInfo = getFiscalQuarter(startDate);
    let currentQuarter = startQuarterInfo.quarter;
    let currentFiscalYear = startQuarterInfo.fiscalYear;

    // Get fiscal quarter info for end date
    const endQuarterInfo = getFiscalQuarter(endDate);
    const endQuarter = endQuarterInfo.quarter;
    const endFiscalYear = endQuarterInfo.fiscalYear;

    // Loop through all quarters in the range
    while (
      currentFiscalYear < endFiscalYear ||
      (currentFiscalYear === endFiscalYear && currentQuarter <= endQuarter)
    ) {
      const periodKey = `FY${currentFiscalYear}-Q${currentQuarter}`;
      const periodLabel = getQuarterLabel(currentQuarter, currentFiscalYear);

      periods.push({ key: periodKey, label: periodLabel });

      // Move to next quarter
      currentQuarter++;
      if (currentQuarter > 4) {
        currentQuarter = 1;
        currentFiscalYear++;
      }
    }
  }
  // For yearly reporting
  else if (reportingPeriod === "yearly") {
    // Get fiscal years for start and end dates
    const startFiscalYear =
      startDate.getMonth() >= 3
        ? startDate.getFullYear()
        : startDate.getFullYear() - 1;

    const endFiscalYear =
      endDate.getMonth() >= 3
        ? endDate.getFullYear()
        : endDate.getFullYear() - 1;

    for (let year = startFiscalYear; year <= endFiscalYear; year++) {
      const periodKey = `FY${year}-${year + 1}`;
      const periodLabel = `FY${year}-${String(year + 1).slice(-2)}`;

      periods.push({ key: periodKey, label: periodLabel });
    }
  }

  return periods;
};

/**
 * Groups analytics data by the specified reporting period
 * @param {Array} data - The raw analytics data with daily entries
 * @param {string} reportingPeriod - The reporting period (daily, monthly, quarterly, yearly)
 * @param {Date} startDate - The start date of the report
 * @param {Date} endDate - The end date of the report
 * @returns {Array} Data grouped by the specified reporting period
 */
export const groupDataByReportingPeriod = (
  data,
  reportingPeriod,
  startDate,
  endDate
) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  // If daily, return the original data
  if (reportingPeriod === "daily") {
    return data;
  }

  // Extract network and profile_id from first data point to use for empty periods
  const network = data[0]?.Network || "";
  const profileId = data[0]?.profile_id;

  // Create a map to group data by period
  const groupedData = new Map();

  // First, process all existing data points
  data.forEach((row) => {
    if (!row.Date) return;

    let date;
    try {
      // Try to parse the date from the row
      date = new Date(row.Date);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date: ${row.Date}`);
        return;
      }
    } catch (e) {
      console.warn(`Error parsing date: ${row.Date}`, e);
      return;
    }

    let periodKey;
    let periodLabel;

    if (reportingPeriod === "monthly") {
      // Group by month (YYYY-MM)
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      periodLabel = getMonthLabel(date);
    } else if (reportingPeriod === "quarterly") {
      // Group by fiscal quarter
      const { quarter, fiscalYear } = getFiscalQuarter(date);
      periodKey = `FY${fiscalYear}-Q${quarter}`;
      periodLabel = getQuarterLabel(quarter, fiscalYear);
    } else if (reportingPeriod === "yearly") {
      // Group by fiscal year
      const fiscalYear =
        date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
      periodKey = `FY${fiscalYear}-${fiscalYear + 1}`;
      periodLabel = `FY${fiscalYear}-${String(fiscalYear + 1).slice(-2)}`;
    }

    if (!periodKey) return;

    if (!groupedData.has(periodKey)) {
      // Create a new entry for this period
      groupedData.set(periodKey, {
        ...row,
        Date: periodLabel,
        _count: 1,
        _originalDate: row.Date,
        _lastFollowersCount: row["lifetime_snapshot.followers_count"] || null,
      });
    } else {
      // Update existing entry with aggregated metrics
      const existingEntry = groupedData.get(periodKey);
      existingEntry._count += 1;

      // Update the last followers count if available
      if (
        row["lifetime_snapshot.followers_count"] !== undefined &&
        row["lifetime_snapshot.followers_count"] !== null
      ) {
        existingEntry._lastFollowersCount =
          row["lifetime_snapshot.followers_count"];
      }

      // Aggregate numeric metrics
      Object.keys(row).forEach((key) => {
        if (
          key !== "Date" &&
          key !== "Network" &&
          key !== "profile_id" &&
          key !== "lifetime_snapshot.followers_count" &&
          typeof row[key] === "number" &&
          !isNaN(row[key])
        ) {
          existingEntry[key] = (existingEntry[key] || 0) + row[key];
        }
      });
    }
  });

  // If we have start and end dates, ensure all periods in range are represented
  if (startDate && endDate) {
    // Generate all periods that should exist in the date range
    const allPeriods = generateAllPeriods(
      new Date(startDate),
      new Date(endDate),
      reportingPeriod
    );

    // Create template object with zero values for all metrics
    const metricTemplate = {};
    // Find all metric keys from existing data
    data.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key !== "Date" && key !== "Network" && key !== "profile_id") {
          metricTemplate[key] = typeof row[key] === "number" ? 0 : null;
        }
      });
    });

    // Add any missing periods with zero values
    allPeriods.forEach((period) => {
      if (!groupedData.has(period.key)) {
        groupedData.set(period.key, {
          Date: period.label,
          Network: network,
          profile_id: profileId,
          _count: 0,
          _lastFollowersCount: null,
          ...metricTemplate,
        });
      }
    });
  }

  // Convert the map back to an array and calculate averages for metrics that should be averaged
  const result = Array.from(groupedData.values()).map((entry) => {
    const result = { ...entry };

    // For lifetime_snapshot.followers_count, use the last value instead of averaging
    if ("_lastFollowersCount" in result) {
      result["lifetime_snapshot.followers_count"] = result._lastFollowersCount;
    }

    // Process metrics that should be averaged rather than summed
    // For example, following count should be averaged for the period
    const metricsToAverage = ["lifetime_snapshot.following_count"];

    metricsToAverage.forEach((metric) => {
      if (metric in result && result._count > 0) {
        result[metric] = Math.round(result[metric] / result._count);
      }
    });

    // Remove helper properties
    delete result._count;
    delete result._originalDate;
    delete result._lastFollowersCount;

    return result;
  });

  // Sort by date
  return result.sort((a, b) => {
    if (reportingPeriod === "quarterly") {
      // For quarterly, extract fiscal year and quarter number
      const aMatch = a.Date.match(/FY(\d+)-\d+.*Q(\d)/);
      const bMatch = b.Date.match(/FY(\d+)-\d+.*Q(\d)/);

      if (aMatch && bMatch) {
        const aYear = parseInt(aMatch[1]);
        const bYear = parseInt(bMatch[1]);

        if (aYear !== bYear) {
          return aYear - bYear;
        }

        const aQuarter = parseInt(aMatch[2]);
        const bQuarter = parseInt(bMatch[2]);
        return aQuarter - bQuarter;
      }
    } else if (reportingPeriod === "yearly") {
      // For yearly, extract fiscal year
      const aMatch = a.Date.match(/FY(\d+)-/);
      const bMatch = b.Date.match(/FY(\d+)-/);

      if (aMatch && bMatch) {
        const aYear = parseInt(aMatch[1]);
        const bYear = parseInt(bMatch[1]);
        return aYear - bYear;
      }
    }

    // Default sorting for monthly and fallback for others
    return a.Date.localeCompare(b.Date);
  });
};
