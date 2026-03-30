"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="login-container">
      <span className="loading-spinner" style={{ width: 40, height: 40, borderTopColor: "var(--color-primary)" }} />
    </div>
  );
}
