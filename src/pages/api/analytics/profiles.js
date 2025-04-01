import axios from 'axios';

/**
 * API route handler for profile analytics
 * 
 * @param {object} req - Next.js request object
 * @param {object} res - Next.js response object
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerId, profileIds, startDate, endDate, reportingPeriod, metrics } = req.body;

    // Validate required parameters
    if (!customerId || !profileIds || !startDate || !endDate || !metrics) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get API key from environment variables
    const apiKey = process.env.SPROUT_API_KEY;
    
    if (!apiKey) {
      console.warn('SPROUT_API_KEY not found in environment variables');
    }

    // Construct the API request to Sprout Social
    const apiUrl = 'https://api.sproutsocial.com/v1/analytics/profiles';
    
    const response = await axios.post(apiUrl, {
      customer_id: customerId,
      profile_ids: profileIds,
      start_date: startDate,
      end_date: endDate,
      reporting_period: reportingPeriod,
      metrics: metrics
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Return the API response
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching profile analytics:', error);
    
    // Return appropriate error response
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.message || 'Internal server error';
    
    return res.status(statusCode).json({ error: errorMessage });
  }
}
