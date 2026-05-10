"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "./common/ToastContext";
import { ObservabilityProvider } from "@/context/ObservabilityContext";
import { AccessProvider } from "@/context/AccessContext";
import { ActivityProvider } from "@/context/ActivityContext";
import { WorkforceProvider } from "@/context/WorkforceContext";
import { OrganizationProvider } from "@/context/OrganizationContext";
import { GuardianProvider } from "@/context/GuardianContext";
import { ForecastingProvider } from "@/context/ForecastingContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { TeamProvider } from "@/context/TeamContext";
import { FinanceProvider } from "@/context/FinanceContext";
import { PayrollProvider } from "@/context/PayrollContext";
import { AuthPersistence } from "@/components/auth/AuthPersistence";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <ObservabilityProvider>
          <AccessProvider>
            <ActivityProvider>
              <WorkforceProvider>
                <OrganizationProvider>
                  <SettingsProvider>
                    <TeamProvider>
                      <FinanceProvider>
                        <PayrollProvider>
                          <GuardianProvider>
                            <ForecastingProvider>
                              <AuthPersistence>
                                {children}
                              </AuthPersistence>
                            </ForecastingProvider>
                          </GuardianProvider>
                        </PayrollProvider>
                      </FinanceProvider>
                    </TeamProvider>
                  </SettingsProvider>
                </OrganizationProvider>
              </WorkforceProvider>
            </ActivityProvider>
          </AccessProvider>
        </ObservabilityProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
