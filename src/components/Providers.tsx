"use client";

import { SessionProvider } from "next-auth/react";
import { AccessProvider } from "@/context/AccessContext";
import { ToastProvider } from "./common/ToastContext";
import { WorkforceProvider } from "@/context/WorkforceContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { OrganizationProvider } from "@/context/OrganizationContext";
import { ActivityProvider } from "@/context/ActivityContext";
import { ObservabilityProvider } from "@/context/ObservabilityContext";
import { ForecastingProvider } from "@/context/ForecastingContext";
import { GuardianProvider } from "@/context/GuardianContext";
import { AuthPersistence } from "@/components/auth/AuthPersistence";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <ObservabilityProvider>
          <AccessProvider>
            <ActivityProvider>
              <GuardianProvider>
                <OrganizationProvider>
                  <WorkforceProvider>
                    <ForecastingProvider>
                      <SettingsProvider>
                        <AuthPersistence>
                          {children}
                        </AuthPersistence>
                      </SettingsProvider>
                    </ForecastingProvider>
                  </WorkforceProvider>
                </OrganizationProvider>
              </GuardianProvider>
            </ActivityProvider>
          </AccessProvider>
        </ObservabilityProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
