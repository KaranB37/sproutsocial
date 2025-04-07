import { useState, useEffect } from "react";
import YoutubePostMetrics from "@/components/YoutubePostMetrics";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/router";
import axios from "axios";

export default function YoutubePostMetricsPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchYoutubeProfiles = async () => {
      try {
        // Get the client data to find customerId
        const clientResponse = await axios.get("/api/proxy/metadata/client");
        const customerId = clientResponse.data.data[0].customer_id;

        // Get all profiles for this customer
        const profilesResponse = await axios.get(
          `/api/proxy/${customerId}/metadata/customer/profiles`
        );

        // Filter to only YouTube profiles
        const youtubeProfiles = profilesResponse.data.data.filter(
          (profile) => profile.network_type === "youtube"
        );

        setProfiles(youtubeProfiles);

        // If there's only one YouTube profile, select it automatically
        if (youtubeProfiles.length === 1) {
          setSelectedProfile(youtubeProfiles[0]);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching YouTube profiles:", error);
        setLoading(false);
      }
    };

    fetchYoutubeProfiles();
  }, []);

  const handleProfileSelect = (profile) => {
    setSelectedProfile(profile);
  };

  const handleBackToProfiles = () => {
    router.push("/profiles");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">YouTube Post Metrics</h1>
        <button
          onClick={handleBackToProfiles}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800"
        >
          Back to Profiles
        </button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          </CardContent>
        </Card>
      ) : profiles.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <p>No YouTube profiles found.</p>
              <button
                onClick={handleBackToProfiles}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md text-white"
              >
                Go to Profiles
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {profiles.length > 1 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Select a YouTube Profile
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {profiles.map((profile) => (
                    <div
                      key={profile.customer_profile_id}
                      onClick={() => handleProfileSelect(profile)}
                      className={`cursor-pointer p-4 rounded-lg border transition-all ${
                        selectedProfile?.customer_profile_id ===
                        profile.customer_profile_id
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-red-300 hover:bg-red-50"
                      }`}
                    >
                      <h3 className="font-medium">{profile.name}</h3>
                      <p className="text-sm text-gray-600">
                        @{profile.native_name}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedProfile && (
            <div className="mt-4">
              <YoutubePostMetrics profile={selectedProfile} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
