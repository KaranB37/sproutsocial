import React from "react";
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

export default function Dashboard({ profiles, customerId, analyticsData }) {
  // Only extract data if analyticsData exists
  let lifetimeFollowersCount = null;
  if (analyticsData && analyticsData.data && analyticsData.data.length > 0) {
    const lastEntry = analyticsData.data[analyticsData.data.length - 1];
    lifetimeFollowersCount =
      lastEntry.metrics["lifetime_snapshot.followers_count"];
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">
            Social Media Dashboard
          </h2>
        </div>

        <Tabs defaultValue="profiles" className="bg-white">
          <TabsList className="bg-white border rounded-md">
            <TabsTrigger
              value="profiles"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 px-4 py-2 rounded-md"
            >
              Profiles
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 px-4 py-2 rounded-md"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="space-y-4">
            <div className="grid gap-4">
              <Card className="bg-white border shadow-sm rounded-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-800 text-xl">
                    Social Media Profiles
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    View and manage all your connected social media accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-300px)]">
                    <SocialMediaProfiles profiles={profiles} />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card className="bg-white border shadow-sm rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-800 text-xl">
                  Analytics
                </CardTitle>
                <CardDescription className="text-gray-600">
                  View and export analytics data for your social media profiles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Analytics profiles={profiles} customerId={customerId} />
                {lifetimeFollowersCount && (
                  <div className="mt-4">
                    <h2 className="text-lg font-bold">Lifetime Followers</h2>
                    <p>{lifetimeFollowersCount}</p>
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
