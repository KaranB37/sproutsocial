import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Home, User, Leaf } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Leaf className="h-8 w-8 text-white mr-2" />
              <Link
                href="/"
                className="text-xl font-bold text-white tracking-wide flex items-center"
              >
                <span>Sprout Social</span>
                <span className="ml-1 bg-white text-blue-600 px-2 py-0.5 rounded-md text-xs font-semibold">
                  Dashboard
                </span>
              </Link>
            </div>
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              <Link
                href="/"
                className="text-white hover:bg-blue-700 transition-colors duration-200 inline-flex items-center px-3 py-2 rounded-md text-sm font-medium"
              >
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center bg-blue-700/50 px-3 py-1.5 rounded-full">
                <User className="h-4 w-4 text-blue-100 mr-2" />
                <span className="text-sm font-medium text-white">
                  {user?.username || "User"}
                </span>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
