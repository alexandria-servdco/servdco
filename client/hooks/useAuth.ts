import { useState, useEffect } from "react";
import { AuthService } from "@/services/auth.service";

export function useAuth() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(AuthService.getCurrentUser());
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    logout: () => {
      AuthService.logout();
      setUser(null);
    }
  };
}
