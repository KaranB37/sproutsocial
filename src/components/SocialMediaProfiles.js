import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button.jsx";
import { ExternalLink, ChevronUp, ChevronDown, BarChart3 } from "lucide-react";
import { FaLinkedin, FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";
import { SiThreads } from "react-icons/si";
import { BsTwitterX } from "react-icons/bs";
import YoutubePostMetrics from "./YoutubePostMetrics";
import { getCustomerId } from "@/api/profiles";
import { isYouTubeProfile, formatProfileName } from "@/utils/profileHelpers";

// Network display name mapping
const NETWORK_DISPLAY_NAMES = {
  fb_instagram_account: "Instagram",
  linkedin_company: "LinkedIn",
  fb_page: "Facebook",
  facebook: "Facebook",
  threads: "Threads",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "Twitter",
};

// Network icon mapping
const NETWORK_ICONS = {
  fb_instagram_account: FaInstagram,
  linkedin_company: FaLinkedin,
  fb_page: FaFacebook,
  facebook: FaFacebook,
  threads: SiThreads,
  youtube: FaYoutube,
  twitter: BsTwitterX,
};

// Network color mapping
const NETWORK_COLORS = {
  fb_instagram_account: "bg-gradient-to-r from-purple-500 to-pink-500",
  linkedin_company: "bg-blue-600",
  fb_page: "bg-blue-700",
  facebook: "bg-blue-700",
  threads: "bg-black",
  youtube: "bg-red-600",
  twitter: "bg-sky-500",
  tiktok: "bg-black",
};

const SocialMediaProfiles = ({ profiles, customerId }) => {
  // State to track which YouTube profiles have expanded metrics
  const [expandedProfiles, setExpandedProfiles] = useState({});
  const [profilesInfo, setProfilesInfo] = useState([]);
  const [customerIdState, setCustomerIdState] = useState(customerId);

  // Fetch customer ID if not provided
  useEffect(() => {
    const fetchCustomerId = async () => {
      if (!customerId) {
        try {
          const id = await getCustomerId();
          console.log("Fetched customer ID:", id);
          setCustomerIdState(id);
        } catch (error) {
          console.error("Error fetching customer ID:", error);
        }
      }
    };

    fetchCustomerId();
  }, [customerId]);

  // Log profiles data for debugging
  useEffect(() => {
    if (profiles && profiles.length > 0) {
      console.log("SocialMediaProfiles - received profiles:", profiles);

      // Check for YouTube profiles
      const youtubeProfiles = profiles.filter(isYouTubeProfile);

      console.log("YouTube profiles found:", youtubeProfiles);
      setProfilesInfo(profiles);
    }
  }, [profiles]);

  // Group profiles by network type, normalizing Facebook variants
  const groupedProfiles = profiles.reduce((groups, profile) => {
    // Normalize network types to group similar networks together
    let networkType = profile.network_type;

    // Group Facebook and fb_page together
    if (networkType === "facebook" || networkType === "fb_page") {
      networkType = "facebook";
    }

    // Normalize YouTube network type (case insensitive)
    if (isYouTubeProfile(profile)) {
      networkType = "youtube";
    }

    if (!groups[networkType]) {
      groups[networkType] = [];
    }
    groups[networkType].push(profile);
    return groups;
  }, {});

  // Network display order
  const networkDisplayOrder = [
    "linkedin_company",
    "fb_instagram_account",
    "facebook",
    "threads",
    "youtube",
    "twitter",
    "tiktok",
  ];

  // Sort network types by the predefined order
  const sortedNetworkTypes = Object.keys(groupedProfiles).sort((a, b) => {
    const indexA = networkDisplayOrder.indexOf(a);
    const indexB = networkDisplayOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // Toggle metrics expansion for a profile
  const toggleProfileMetrics = (profileId) => {
    console.log("Toggling metrics for profile:", profileId);
    setExpandedProfiles((prev) => ({
      ...prev,
      [profileId]: !prev[profileId],
    }));
  };

  return (
    <div className="space-y-8">
      {sortedNetworkTypes.map((networkType) => {
        console.log(
          `Rendering network type: ${networkType} with ${groupedProfiles[networkType].length} profiles`
        );
        return (
          <div key={networkType} className="space-y-4">
            <div className="flex items-center gap-2">
              {NETWORK_ICONS[networkType] && (
                <div
                  className={`p-2 rounded-full text-white ${NETWORK_COLORS[networkType]}`}
                >
                  {React.createElement(NETWORK_ICONS[networkType], {
                    className: "w-5 h-5",
                  })}
                </div>
              )}
              <h3 className="text-2xl font-semibold">
                {NETWORK_DISPLAY_NAMES[networkType] ||
                  networkType.replace(/_/g, " ").toUpperCase()}
              </h3>
              <Badge variant="outline" className="ml-2">
                {groupedProfiles[networkType].length}{" "}
                {groupedProfiles[networkType].length === 1
                  ? "account"
                  : "accounts"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedProfiles[networkType].map((profile) => {
                const isYouTube = networkType.toLowerCase() === "youtube";
                console.log(
                  `Profile: ${profile.name}, ID: ${profile.customer_profile_id}, isYouTube: ${isYouTube}`
                );

                return (
                  <div key={profile.customer_profile_id}>
                    <Card className="overflow-hidden">
                      <div className={`h-2 ${NETWORK_COLORS[networkType]}`} />
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg">
                              {formatProfileName(profile)}
                            </h4>
                            {NETWORK_ICONS[networkType] &&
                              React.createElement(NETWORK_ICONS[networkType], {
                                className: "w-5 h-5 text-gray-500",
                              })}
                          </div>
                          <p className="text-sm text-gray-500">
                            @{profile.native_name || "username"}
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter className="border-t bg-gray-50 px-6 py-3 flex flex-col space-y-2">
                        <div className="w-full flex justify-between">
                          {profile.link ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-between flex-1"
                              asChild
                            >
                              <a
                                href={profile.link}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View Profile
                                <ExternalLink className="h-4 w-4 ml-2" />
                              </a>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-between flex-1 text-gray-400"
                              disabled
                            >
                              Profile Link Unavailable
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </Button>
                          )}
                        </div>

                        {/* YouTube specific metrics button */}
                        {isYouTube && (
                          <div className="w-full">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-between bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                              onClick={() =>
                                toggleProfileMetrics(
                                  profile.customer_profile_id
                                )
                              }
                            >
                              {expandedProfiles[profile.customer_profile_id] ? (
                                <>
                                  Hide YouTube Metrics
                                  <ChevronUp className="h-4 w-4 ml-2" />
                                </>
                              ) : (
                                <>
                                  YouTube Metrics
                                  <BarChart3 className="h-4 w-4 ml-2" />
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </CardFooter>
                    </Card>

                    {/* YouTube metrics panel (expanded) */}
                    {isYouTube &&
                      expandedProfiles[profile.customer_profile_id] && (
                        <div className="mt-2">
                          <YoutubePostMetrics
                            profile={profile}
                            customerId={customerIdState}
                          />
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SocialMediaProfiles;
