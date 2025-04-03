import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

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
    // Navigate to the index page with the selected group ID
    router.push({
      pathname: "/",
      query: { groupId },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Loader className="text-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center mt-4">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Select a Group
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Choose a group to manage social content
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card
              key={group.group_id}
              onClick={() => handleGroupClick(group.group_id)}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-300 bg-white border border-gray-200 rounded-lg"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                      {group.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-semibold text-gray-800">
                        {group.name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {group.members} members
                      </p>
                    </div>
                  </div>
                  <Button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                    Select
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
