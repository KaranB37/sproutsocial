import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import SocialMediaProfiles from "@/components/SocialMediaProfiles";
import Analytics from "@/components/Analytics";
import { LayoutDashboard, BarChart2, Users } from "lucide-react";
import { logProfilesInfo } from "@/utils/debug";
import { isYouTubeProfile } from "@/utils/profileHelpers";

export default function Dashboard({ profiles, customerId, analyticsData }) {
  const router = useRouter();
  const { groupId } = router.query;
  const [groupName, setGroupName] = useState("");

  // Debug profiles data when component mounts or profiles change
  useEffect(() => {
    try {
      console.log("Dashboard received profiles:", profiles?.length || 0);
      if (profiles && profiles.length > 0) {
        logProfilesInfo(profiles);
      }
    } catch (error) {
      console.error("Error logging profile info:", error);
    }
  }, [profiles]);

  // Only extract data if analyticsData exists
  let lifetimeFollowersCount = null;
  if (analyticsData && analyticsData.data && analyticsData.data.length > 0) {
    const lastEntry = analyticsData.data[analyticsData.data.length - 1];
    lifetimeFollowersCount =
      lastEntry.metrics["lifetime_snapshot.followers_count"];
  }

  // Find the group name if profiles are available
  useEffect(() => {
    if (profiles && profiles.length > 0 && groupId) {
      // Try to find the group name from the first profile that has this group
      const profile = profiles.find(
        (p) => p.groups && p.groups.includes(parseInt(groupId))
      );
      if (profile && profile.group_names) {
        const group = profile.group_names.find(
          (g) => g.id === parseInt(groupId)
        );
        if (group) {
          setGroupName(group.name);
        }
      }
    }
  }, [profiles, groupId]);

  // Count YouTube profiles
  const youtubeProfilesCount = profiles
    ? profiles.filter(isYouTubeProfile).length
    : 0;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-800 flex items-center">
              <LayoutDashboard className="mr-2 h-8 w-8 text-blue-600" />
              Social Media Dashboard
            </h2>
            {groupName && (
              <div className="mt-2 flex items-center text-gray-600">
                <Users className="h-4 w-4 mr-2 text-blue-500" />
                <span>
                  Group:{" "}
                  <span className="font-semibold text-blue-600">
                    {groupName}
                  </span>
                </span>
              </div>
            )}
            {youtubeProfilesCount > 0 && (
              <div className="mt-1 text-sm text-gray-500">
                <span className="text-red-600">{youtubeProfilesCount}</span>{" "}
                YouTube {youtubeProfilesCount === 1 ? "profile" : "profiles"}{" "}
                available with post metrics
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="profiles" className="bg-white">
          <TabsList className="bg-white border rounded-lg overflow-hidden p-1 mb-6 shadow-sm">
            <TabsTrigger
              value="profiles"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 py-3 rounded-md transition-all duration-200"
            >
              <span className="flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Profiles
                {youtubeProfilesCount > 0 && (
                  <span className="ml-2 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded">
                    YT Metrics
                  </span>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-6 py-3 rounded-md transition-all duration-200"
            >
              <span className="flex items-center">
                <BarChart2 className="mr-2 h-4 w-4" />
                Analytics
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="space-y-4">
            <div className="grid gap-4">
              <Card className="bg-white border hover:shadow-md transition-shadow duration-300 rounded-lg">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-gray-800 text-xl">
                    Social Media Profiles
                    {groupName && (
                      <span className="ml-2 text-sm text-blue-600">
                        ({groupName})
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    View and manage all your connected social media accounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <SocialMediaProfiles
                      profiles={profiles}
                      customerId={customerId}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card className="bg-white border hover:shadow-md transition-shadow duration-300 rounded-lg">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-gray-800 text-xl">
                  Analytics Dashboard
                  {groupName && (
                    <span className="ml-2 text-sm text-blue-600">
                      ({groupName})
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  View and export analytics data for your social media profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Analytics profiles={profiles} customerId={customerId} />
                {lifetimeFollowersCount && (
                  <div className="mt-6 p-4 border rounded-lg bg-blue-50">
                    <h2 className="text-lg font-bold text-blue-800 mb-2">
                      Lifetime Followers
                    </h2>
                    <p className="text-3xl font-bold text-blue-900">
                      {lifetimeFollowersCount.toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
