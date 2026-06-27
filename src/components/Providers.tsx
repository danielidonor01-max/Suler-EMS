"use client";

import { SWRConfig } from "swr";
import { SessionProvider } from "next-auth/react";
import { SessionVersionWatcher } from "@/lib/auth/SessionVersionWatcher";
import { ToastProvider } from "./common/ToastContext";
import { ConfirmProvider } from "./common/ConfirmDialog";
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
import { IdleSessionMonitor } from "@/components/auth/IdleSessionMonitor";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Two GET hooks on the same URL inside this window share one
        // request — eliminates the duplicate fetch when EmployeeChip and
        // the profile modal both mount for the same employee.
        dedupingInterval:    5_000,
        // Window focus revalidation is noisy in a dashboard where users
        // switch tabs constantly. Background polling (refreshInterval)
        // already covers freshness for surfaces that care.
        revalidateOnFocus:   false,
        // Don't keep polling while the tab is in the background. Cuts
        // request rate roughly in half on a typical multi-tab session.
        refreshWhenHidden:   false,
        // Reconnect revalidation stays on — useful when the user's
        // laptop wakes from sleep.
        revalidateOnReconnect: true,
      }}
    >
    <SessionProvider>
      <SessionVersionWatcher />
      <PreferencesProvider>
      <ToastProvider>
      <ConfirmProvider>
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
                                    <IdleSessionMonitor />
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
      </ConfirmProvider>
      </ToastProvider>
      </PreferencesProvider>
    </SessionProvider>
    </SWRConfig>
  );
}
