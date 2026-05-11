import { Parser } from 'json2csv';
import { format } from 'date-fns';

/**
 * Export Utilities
 * Isolated layer for formatting organizational records.
 */
export class ExportUtils {
  /**
   * Convert JSON data to CSV with Nigerianized headers
   */
  static jsonToCSV(data: any[], type: string): string {
    if (!data || data.length === 0) return "";

    let fields: string[] = [];
    
    // Customize headers based on report type
    switch (type) {
      case 'WORKFORCE_COMPOSITION':
        fields = [
          { label: 'Staff ID', value: 'staffId' },
          { label: 'Full Name', value: (row: any) => `${row.firstName} ${row.lastName}` },
          { label: 'Email', value: 'email' },
          { label: 'Department', value: 'department.name' },
          { label: 'Role', value: 'jobTitle' },
          { label: 'NIN', value: 'nin' },
          { label: 'PFA/Pension', value: 'pensionPFA' },
          { label: 'Status', value: 'status' }
        ] as any;
        break;

      case 'ATTENDANCE_COMPLIANCE':
        fields = [
          { label: 'Date', value: (row: any) => format(new Date(row.date), 'dd/MM/yyyy') },
          { label: 'Staff ID', value: 'employee.staffId' },
          { label: 'Employee', value: 'employee.name' },
          { label: 'Check In', value: (row: any) => row.checkIn ? format(new Date(row.checkIn), 'HH:mm') : 'N/A' },
          { label: 'Check Out', value: (row: any) => row.checkOut ? format(new Date(row.checkOut), 'HH:mm') : 'N/A' },
          { label: 'Status', value: 'status' }
        ] as any;
        break;

      default:
        // Generic fields if type not matched
        fields = Object.keys(data[0]);
    }

    const parser = new Parser({ fields });
    return parser.parse(data);
  }

  /**
   * Placeholder for PDF generation
   */
  static async jsonToPDF(data: any[], type: string): Promise<Buffer> {
    // In a real implementation, we would use jspdf or similar
    // For now, return an empty buffer or a simple text-based buffer
    return Buffer.from(`PDF Export for ${type} not yet implemented. Use CSV for now.`);
  }
}
