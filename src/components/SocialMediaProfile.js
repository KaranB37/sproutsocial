import React from "react";
import { FaLinkedin, FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";
import { SiThreads } from "react-icons/si";
import { BsTwitterX } from "react-icons/bs";

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

const SocialMediaProfile = ({ profile }) => {
  const { network_type, name, native_name, link } = profile;

  // Get display name for the network
  const networkDisplayName =
    NETWORK_DISPLAY_NAMES[network_type] ||
    network_type.replace(/_/g, " ").toUpperCase();

  // Get icon for the network
  const IconComponent = NETWORK_ICONS[network_type] || null;

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center mb-4">
        {IconComponent && (
          <IconComponent className="text-2xl mr-3 text-gray-600" />
        )}
        <h3 className="text-xl font-semibold text-gray-800">
          {networkDisplayName}
        </h3>
      </div>

      <div className="mb-4">
        <p className="text-lg text-gray-800">{name}</p>
        <p className="text-gray-600">@{native_name || "username"}</p>
      </div>

      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          View Profile
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </a>
      ) : (
        <span className="text-gray-400 flex items-center cursor-not-allowed">
          Profile Link Unavailable
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </span>
      )}
    </div>
  );
};

export default SocialMediaProfile;
