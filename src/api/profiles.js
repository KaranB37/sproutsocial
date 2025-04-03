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
    const { data: profileData } = await axiosInstance.get(
      `${customerId}/metadata/customer`
    );
    console.log("Profiles API response:", profileData);

    // Fetch groups information
    console.log("Fetching groups for customer ID:", customerId);
    const { data: groupData } = await axiosInstance.get(
      `${customerId}/metadata/customer/groups`
    );
    console.log("Groups API response:", groupData);

    // Create a map of group IDs to group names for easy lookup
    const groupMap = {};
    if (groupData && groupData.data && Array.isArray(groupData.data)) {
      groupData.data.forEach((group) => {
        groupMap[group.group_id] = {
          id: group.group_id,
          name: group.name,
          members: group.members || 0,
        };
      });
    }

    // Attach group names to profiles
    const profilesWithGroups = profileData.data.map((profile) => {
      // Create a group_names array that contains name data for each group ID
      const group_names = Array.isArray(profile.groups)
        ? profile.groups.map(
            (groupId) =>
              groupMap[groupId] || { id: groupId, name: `Group ${groupId}` }
          )
        : [];

      return {
        ...profile,
        group_names,
      };
    });

    // Log each profile with its ID, network type, and groups
    if (profilesWithGroups && Array.isArray(profilesWithGroups)) {
      console.log("Profile summary:");
      profilesWithGroups.forEach((profile) => {
        console.log(
          `- ID: ${profile.customer_profile_id}, Network: ${
            profile.network_type
          }, Name: ${profile.name}, Groups: ${profile.group_names
            .map((g) => g.name)
            .join(", ")}`
        );
      });
    }

    return profilesWithGroups;
  } catch (error) {
    console.error("Profile fetch error:", error);
    throw new Error("Failed to fetch profiles");
  }
};
