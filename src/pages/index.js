import { useEffect, useState } from "react";
import { getCustomerId, getProfiles } from "@/api/profiles";
import ProfileCard from "@/components/ProfileCard";
import Analytics from "@/components/Analytics";

export default function Home() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerId, setCustomerId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const newCustomerId = await getCustomerId();
        setCustomerId(newCustomerId);
        const profilesData = await getProfiles(newCustomerId);
        setProfiles(profilesData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-red-600 text-xl font-bold mb-2">Error</h2>
        <p className="text-gray-800 bg-red-100 p-4 rounded-lg">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Group profiles by network type
  const groupedProfiles = profiles.reduce((acc, profile) => {
    const type = profile.network_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(profile);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Social Media Profiles
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(groupedProfiles).map(([networkType, profiles]) => (
            <ProfileCard
              key={networkType}
              networkType={networkType}
              profiles={profiles}
            />
          ))}
        </div>
      </div>
      {profiles.length > 0 && (
        <Analytics profiles={profiles} customerId={customerId} />
      )}
    </div>
  );
}
