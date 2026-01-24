"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ApiKeyModal } from "@/components/api-key/ApiKeyModal";
import { Loader2 } from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, apiKeyStatus, refreshApiKeyStatus } = useAuth();
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && apiKeyStatus && !apiKeyStatus.has_key) {
      setShowApiKeyModal(true);
    } else {
      setShowApiKeyModal(false);
    }
  }, [isAuthenticated, apiKeyStatus]);

  const handleApiKeySuccess = async () => {
    await refreshApiKeyStatus();
    setShowApiKeyModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {children}
      {showApiKeyModal && <ApiKeyModal onSuccess={handleApiKeySuccess} />}
    </>
  );
}
