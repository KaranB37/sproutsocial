import {
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaTwitter,
} from "react-icons/fa";

const NetworkIcons = {
  linkedin_company: FaLinkedin,
  fb_instagram_account: FaInstagram,
  facebook: FaFacebook,
  youtube: FaYoutube,
  twitter: FaTwitter,
};

export default function ProfileCard({ networkType, profiles }) {
  const Icon = NetworkIcons[networkType];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        {Icon && <Icon className="w-6 h-6 text-gray-700" />}
        <h2 className="text-xl font-semibold capitalize text-gray-900">
          {networkType.replace(/_/g, " ")}
        </h2>
      </div>

      <div className="space-y-4">
        {profiles.map((profile) => (
          <div
            key={profile.customer_profile_id}
            className="border-t pt-4 first:border-t-0 first:pt-0"
          >
            <h3 className="font-medium text-gray-900">{profile.name}</h3>
            <p className="text-sm text-gray-700">@{profile.native_name}</p>
            {profile.link && (
              <a
                href={profile.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline mt-2 inline-block"
              >
                View Profile →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
