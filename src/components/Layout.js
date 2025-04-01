import Navbar from "./Navbar";
import { useAuth } from "@/contexts/AuthContext";

export default function Layout({ children }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {isAuthenticated() && <Navbar />}
      <main className="flex-grow">{children}</main>
    </div>
  );
}
