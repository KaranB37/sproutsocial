import { axiosInstance } from "./config";

class APIError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.details = details;
  }
}

export const getCustomerId = async () => {
  try {
    const storedCustomerId = localStorage.getItem("customerId");
    if (storedCustomerId) {
      console.log(
        "Using stored customer ID from localStorage:",
        storedCustomerId
      );
      return storedCustomerId;
    }

    console.log("Fetching customer ID from API...");
    const { data } = await axiosInstance.get("/metadata/client");
    console.log("Customer ID API response:", data);

    const newCustomerId = data.data[0].customer_id;
    console.log("New customer ID:", newCustomerId);

    localStorage.setItem("customerId", newCustomerId);
    return newCustomerId;
  } catch (error) {
    console.error("Customer ID fetch error:", error);
    const storedCustomerId = localStorage.getItem("customerId");
    if (storedCustomerId) {
      console.log("Falling back to stored customer ID:", storedCustomerId);
      return storedCustomerId;
    }
    throw new Error("Failed to fetch customer ID");
  }
};

export const getProfiles = async (customerId) => {
  try {
    if (!customerId) {
      throw new Error("Customer ID is required");
    }

    console.log("Fetching profiles with customer ID:", customerId);
    const { data } = await axiosInstance.get(`${customerId}/metadata/customer`);
    console.log("Profiles API response:", data);

    // Log each profile with its ID and network type
    if (data.data && Array.isArray(data.data)) {
      console.log("Profile summary:");
      data.data.forEach((profile) => {
        console.log(
          `- ID: ${profile.customer_profile_id}, Network: ${profile.network_type}, Name: ${profile.name}`
        );
      });
    }

    return data.data;
  } catch (error) {
    console.error("Profile fetch error:", error);
    throw new Error("Failed to fetch profiles");
  }
};
