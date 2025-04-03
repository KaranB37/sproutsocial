import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { toast, Toaster } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated - using window.location for most reliable redirection
  useEffect(() => {
    if (isAuthenticated() && !redirecting) {
      console.log(
        "User is already authenticated, redirecting to group selection..."
      );
      setRedirecting(true);
      window.location.href = "/groupSelection";
    }
  }, [isAuthenticated, redirecting]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.ok) {
        // Store authentication token in localStorage
        login(data.user, data.token);
        toast.success("Login successful!");

        setRedirecting(true);

        // Force a hard redirect with window.location
        // This is the most reliable method across different environments
        window.location.href = "/groupSelection";
      } else {
        toast.error("Authentication failed. Please check your credentials.");
        setError(
          data.error || "Authentication failed. Please check your credentials."
        );
        console.log("Login error:", data.details);
      }
    } catch (error) {
      toast.error("Authentication failed. Please check your credentials.");
      setError("Authentication failed. Please check your credentials.");
      console.log("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Toaster />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Sprout Social Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}
          {redirecting ? (
            <div className="text-center p-4">
              <p>Redirecting to Group Selection...</p>
              <div className="mt-2 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Enter your username"
                    className="text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-white"
                    placeholder="Enter your password"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
