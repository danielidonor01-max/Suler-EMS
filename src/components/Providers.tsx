"use client";

import { SessionProvider } from "next-auth/react";
import { SessionVersionWatcher } from "@/lib/auth/SessionVersionWatcher";
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
import { CommunicationProvider } from "@/context/CommunicationContext";
import { PreferencesProvider } from "@/context/PreferencesContext";
import { EmployeeProfileProvider } from "@/context/EmployeeProfileContext";
import { AuthPersistence } from "@/components/auth/AuthPersistence";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionVersionWatcher />
      <PreferencesProvider>
      <ToastProvider>
        <ObservabilityProvider>
          <AccessProvider>
            <ActivityProvider>
              <CommunicationProvider>
                <WorkforceProvider>
                  <OrganizationProvider>
                    <SettingsProvider>
                      <TeamProvider>
                        <FinanceProvider>
                          <PayrollProvider>
                            <GuardianProvider>
                              <ForecastingProvider>
                                <EmployeeProfileProvider>
                                  <AuthPersistence>
                                    {children}
                                  </AuthPersistence>
                                </EmployeeProfileProvider>
                              </ForecastingProvider>
                            </GuardianProvider>
                          </PayrollProvider>
                        </FinanceProvider>
                      </TeamProvider>
                    </SettingsProvider>
                  </OrganizationProvider>
                </WorkforceProvider>
              </CommunicationProvider>
            </ActivityProvider>
          </AccessProvider>
        </ObservabilityProvider>
      </ToastProvider>
      </PreferencesProvider>
    </SessionProvider>
  );
}
