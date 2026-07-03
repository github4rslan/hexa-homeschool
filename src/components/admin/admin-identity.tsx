"use client";

import { createContext, useContext } from "react";

export interface AdminIdentity {
  name: string;
  role: string;
}

const AdminIdentityContext = createContext<AdminIdentity | null>(null);

/** Provides the signed-in staff identity to admin chrome (e.g. the mobile drawer). */
export function AdminIdentityProvider({
  value,
  children,
}: {
  value: AdminIdentity;
  children: React.ReactNode;
}) {
  return (
    <AdminIdentityContext.Provider value={value}>
      {children}
    </AdminIdentityContext.Provider>
  );
}

export function useAdminIdentity(): AdminIdentity | null {
  return useContext(AdminIdentityContext);
}
