import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Users, ArrowRight, Layers } from "lucide-react";

export default function GroupSelectionPage() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        // Use proxy to call the client API
        const clientResponse = await axios.get("/api/proxy/metadata/client");
        const customerId = clientResponse.data.data[0].customer_id;

        // Use proxy to call the groups API
        const groupsResponse = await axios.get(
          `/api/proxy/${customerId}/metadata/customer/groups`
        );

        // Log sanitized groups response without group IDs
        console.log(
          "Groups Response: [Group data available - IDs hidden for security]"
        );
        console.log("Groups Data:", {
          ...groupsResponse.data,
          data: groupsResponse.data.data.map((group) => ({
            name: group.name,
            id: "********", // Hide real ID
          })),
        });
        console.log("Groups Count:", groupsResponse.data.data.length);

        setGroups(groupsResponse.data.data);
      } catch (err) {
        setError("Failed to fetch groups. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleGroupClick = (groupId) => {
    // Log the selected group without showing the actual ID
    const selectedGroup = groups.find((group) => group.group_id === groupId);
    console.log("Selected Group:", {
      name: selectedGroup.name,
      id: "********", // Hide the actual ID
    });

    // Navigate to the index page with the selected group ID
    router.push({
      pathname: "/",
      query: { groupId },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="text-center">
          <Loader className="h-10 w-10 text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-700 text-xl font-bold mb-3">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Log only the allowed groups
  const filteredGroups = groups.filter(
    (group) => group.name === "Schbang" || group.name === "Level SuperMind"
  );

  console.log(
    "Filtered Groups with Details:",
    filteredGroups.map((group) => ({
      name: group.name,
      id: "********", // Hide the actual ID
    }))
  );

  const getRandomColor = (str) => {
    const colors = [
      "bg-blue-500",
      "bg-indigo-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-red-500",
      "bg-orange-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-lime-500",
      "bg-green-500",
      "bg-emerald-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-sky-500",
    ];

    // Generate a simple hash of the string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use the hash to pick a color
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center mb-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
            <Users className="h-4 w-4 mr-2" />
            <span>Group Selection</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Select a Group
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Choose a group to manage social content and view analytics for your
            social media profiles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Log groups before rendering */}
          {console.log(
            "Rendering filtered groups:",
            filteredGroups.map((group) => ({
              name: group.name,
              id: "********", // Hide the actual ID
            }))
          )}

          {groups
            .filter(
              (group) =>
                group.name === "Schbang" || group.name === "Level SuperMind"
            )
            .map((group) => {
              const bgColor = getRandomColor(group.name);
              return (
                <Card
                  key={group.group_id}
                  onClick={() => handleGroupClick(group.group_id)}
                  className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className={`h-2 ${bgColor}`}></div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between p-2">
                      <div className="flex items-center">
                        <div
                          className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center text-white font-bold text-lg`}
                        >
                          {group.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <h2 className="text-xl font-bold text-gray-800">
                            {group.name}
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Layers className="h-4 w-4 mr-1 text-gray-400" />
                        <span>View profiles</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}
