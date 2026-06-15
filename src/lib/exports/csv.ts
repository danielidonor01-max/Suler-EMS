/**
 * CSV export helper. Uses csv-stringify for proper RFC 4180 escaping
 * (commas, quotes, newlines inside cells are handled).
 */

import { stringify } from 'csv-stringify/sync';

export interface CsvColumn<T> {
  key: string;
  header: string;
  /** Map a row to the cell value. Strings, numbers, booleans, null/undefined OK. */
  get: (row: T) => string | number | boolean | null | undefined;
}

/**
 * Render an array of rows to a CSV string with a header line.
 * Returns the CSV text; the caller is responsible for setting the
 * Content-Type and Content-Disposition headers.
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map(c => c.header);
  const body = rows.map(row =>
    columns.map(c => {
      const v = c.get(row);
      return v === null || v === undefined ? '' : v;
    }),
  );
  return stringify([header, ...body], {
    quoted_string: true,
  });
}

/** Build a Response for streaming CSV download in a Next.js route handler. */
export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
