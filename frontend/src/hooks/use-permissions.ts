"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { User } from "@/types";

export function usePermissions() {
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => api<User>("/auth/me"),
  });
  return {
    user,
    canEdit: user?.role === "admin" || user?.role === "builder",
    isAdmin: user?.role === "admin",
  };
}
