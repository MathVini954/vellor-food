import { createContext, useContext } from "react";
import type { AdminNotification, AdminUnreadSignals } from "../types/dashboard";

type AdminLayoutContextValue = {
  notifications: AdminNotification[];
  unreadSignals: AdminUnreadSignals;
  onOpenNotifications: () => void;
};

const defaultValue: AdminLayoutContextValue = {
  notifications: [],
  unreadSignals: {
    online: 0,
    tables: 0,
  },
  onOpenNotifications: () => undefined,
};

export const AdminLayoutContext = createContext<AdminLayoutContextValue>(defaultValue);

export function useAdminLayoutContext() {
  return useContext(AdminLayoutContext);
}
