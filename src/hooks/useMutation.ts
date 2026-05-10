"use client";

import { useState, useCallback } from 'react';
import { useToast } from '@/components/common/ToastContext';
import { useActivity } from '@/context/ActivityContext';
import { useAccess } from '@/context/AccessContext';
import { useObservability } from '@/context/ObservabilityContext';
import { useGuardian } from '@/context/GuardianContext';

interface MutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
  activityLabel?: string;
  activityType?: 'PROVISIONING' | 'GOVERNANCE' | 'SECURITY' | 'SYSTEM';
  successMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  rollbackAction?: () => void;
  expectedVersion?: number;
  requiresApproval?: boolean;
  approvalLabel?: string;
}

export function useMutation<TVariables = any, TData = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: MutationOptions<TData> = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { pushActivity } = useActivity();
  const { startTrace, endTrace } = useObservability();
  const { userRole } = useAccess();
  const { requestApproval, monitorMutation } = useGuardian();

  const mutate = useCallback(async (variables: TVariables) => {
    // 0. Anomaly Detection Monitor
    monitorMutation();

    // 1. Check for Guardian Protocol interception
    if (options.requiresApproval) {
      toast({
        type: 'warning',
        message: 'Guardian Protocol Intercepted',
        description: 'This operation requires multi-signature authorization. Intent forwarded to the Approval Registry.'
      });

      await requestApproval({
        type: 'HIERARCHY_SHIFT', // Default or map from options
        label: options.approvalLabel || options.activityLabel || 'Sensitive Mutation',
        description: `Operational intent detected for [${options.activityLabel}]. Multi-signature clearance required for execution.`,
        requester: userRole,
        requiredApprovals: 2,
        payload: variables,
        mutationType: options.activityLabel || 'UNKNOWN'
      });

      return; // Suspend execution
    }

    setIsLoading(true);
    setError(null);
    const traceId = startTrace(options.activityLabel || 'System Mutation');

    const toastId = toast({
      type: 'loading',
      message: options.loadingMessage || 'Processing mutation...',
      description: 'Synchronizing with enterprise nodes.'
    });

    try {
      // Simulation of Backend Authority / OCC
      if (options.expectedVersion !== undefined) {
        // Mock: In a real app, this would be the actual DB version check
        const currentServerVersion = Number(localStorage.getItem(`suler_v_${options.activityLabel}`) || '1');
        if (options.expectedVersion < currentServerVersion) {
          const conflictError = new Error('CONCURRENCY_CONFLICT');
          (conflictError as any).status = 409;
          (conflictError as any).serverVersion = currentServerVersion;
          throw conflictError;
        }
      }

      const data = await mutationFn(variables);
      
      // Update local version simulation
      if (options.activityLabel) {
        const nextV = (options.expectedVersion || 1) + 1;
        localStorage.setItem(`suler_v_${options.activityLabel}`, nextV.toString());
      }

      if (options.activityLabel) {
        pushActivity({
          type: options.activityType || 'SYSTEM',
          label: options.activityLabel,
          message: options.successMessage || 'Action completed successfully.',
          author: userRole,
          status: 'SUCCESS',
          correlationId: traceId // Link to trace
        } as any);
      }

      toast({
        type: 'success',
        message: options.successMessage || 'Action successful',
        description: 'Organizational state synchronized globally.'
      });

      endTrace(traceId, 'SUCCESS');
      options.onSuccess?.(data);
      return data;
    } catch (err: any) {
      const isConflict = err.message === 'CONCURRENCY_CONFLICT' || err.status === 409;
      const error = err instanceof Error ? err : new Error(err.message || 'Unknown error');
      setError(error);

      endTrace(traceId, isConflict ? 'CONFLICT' : 'FAILURE');

      if (isConflict) {
        toast({
          type: 'error',
          message: 'Governance Conflict Detected',
          description: 'This record was modified by another administrator. Please reconcile state.'
        });
        // We'll trigger the Resolution UI via global state or direct return
      } else {
        toast({
          type: 'error',
          message: options.errorMessage || 'Action Failed',
          description: error.message
        });
      }

      if (options.activityLabel) {
        pushActivity({
          type: options.activityType || 'SYSTEM',
          label: `${options.activityLabel} Failed`,
          message: isConflict ? 'Structural version mismatch (OCC)' : error.message,
          author: userRole,
          status: 'FAILURE',
          correlationId: traceId
        } as any);
      }

      if (options.rollbackAction && !isConflict) {
        options.rollbackAction();
      }

      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
      options.onSettled?.();
    }
  }, [mutationFn, options, toast, pushActivity, userRole, startTrace, endTrace, requestApproval, monitorMutation]);

  return { mutate, isLoading, error };
}
