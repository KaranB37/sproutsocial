import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getCustomerId, getProfiles } from "@/api/profiles";
import Dashboard from "@/components/Dashboard";
import { Loader } from "@/components/ui/loader";

export default function Home() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const router = useRouter();
  const { groupId } = router.query;

  useEffect(() => {
    const loadData = async () => {
      try {
        const newCustomerId = await getCustomerId();
        setCustomerId(newCustomerId);
        const profilesData = await getProfiles(newCustomerId);

        // Filter profiles by group ID if provided
        const filteredProfiles = groupId
          ? profilesData.filter((profile) =>
              profile.groups.includes(parseInt(groupId))
            )
          : profilesData;

        setProfiles(filteredProfiles);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader />
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

  return (
    <div className="bg-white">
      <Dashboard profiles={profiles} customerId={customerId} />
    </div>
  );
}
