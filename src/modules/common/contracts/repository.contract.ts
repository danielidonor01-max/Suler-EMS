import { Result } from "@/types/api";
import { UUID } from "@/types/common";
import { WorkflowInstance, WorkflowTransitionContext } from "@/modules/workflow/domain/workflow.types";
import { EmployeeResponseDTO } from "@/modules/employees/dto/employee.dto";

/**
 * Base Repository Interface
 */
export interface IRepository<T, TCreate = any, TUpdate = any> {
  findById(id: UUID): Promise<Result<T>>;
  findAll(filters?: any): Promise<Result<T[]>>;
  create(data: TCreate): Promise<Result<T>>;
  update(id: UUID, data: TUpdate): Promise<Result<T>>;
  delete(id: UUID): Promise<Result<boolean>>;
}

/**
 * Specialized Employee Repository Contract
 */
export interface IEmployeeRepository extends IRepository<EmployeeResponseDTO> {}

/**
 * Specialized Workflow Repository for Transactional Orchestration
 */
export interface IWorkflowRepository {
  getInstance(id: UUID): Promise<Result<WorkflowInstance>>;
  
  /**
   * Executes a workflow transition atomically.
   * Updates state + creates audit entry + (optional) updates resource status.
   */
  executeTransition(
    context: WorkflowTransitionContext,
    resourceUpdate?: { table: string, status: string }
  ): Promise<Result<WorkflowInstance>>;

  createInstance(data: Partial<WorkflowInstance>): Promise<Result<WorkflowInstance>>;
}

/**
 * Normalized API Error Response Structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  correlationId: string;
}
