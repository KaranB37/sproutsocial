import "@/styles/globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import { useRouter } from "next/router";

// Pages that don't require authentication
const publicPages = ["/login"];

export default function App({ Component, pageProps }) {
  const router = useRouter();
  
  // Check if the current route is a public page
  const isPublicPage = publicPages.includes(router.pathname);

  return (
    <AuthProvider>
      <Layout>
        {isPublicPage ? (
          <Component {...pageProps} />
        ) : (
          <ProtectedRoute>
            <Component {...pageProps} />
          </ProtectedRoute>
        )}
      </Layout>
    </AuthProvider>
  );
}
