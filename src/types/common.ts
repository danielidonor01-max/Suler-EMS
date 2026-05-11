// Audit traits for all business entities
export interface AuditMetadata {
  createdAt: string; // ISO 8601 string
  updatedAt: string;
  createdBy: string; // User ID
  updatedBy: string;
}

// Soft delete capability
export interface SoftDelete {
  deletedAt?: string | null;
  isArchived: boolean;
}

// Generic branded type for IDs (optional, but good for explicit typing)
export type UUID = string;
