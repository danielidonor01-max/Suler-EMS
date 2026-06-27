/**
 * Humanizes Zod validation errors that arrived from the API as a
 * stringified `parsed.error.message` (the default Zod payload, which is
 * a JSON array of issue objects). Renders them as a short, readable list
 * keyed by field instead of pasting raw JSON into the UI.
 *
 * If the input isn't recognisably a Zod issues array, the original
 * message passes through unchanged — non-validation errors (FORBIDDEN,
 * DUPLICATE, etc.) keep their human messages intact.
 */

interface ZodIssue {
  path?: Array<string | number>;
  message?: string;
  code?: string;
  format?: string;
}

const FIELD_LABEL: Record<string, string> = {
  code:              'Code',
  name:              'Name',
  managerId:         'Manager',
  hubId:             'Parent Hub',
  reportingLine:     'Reports To',
  departmentId:      'Department',
  employeeId:        'Employee',
  reviewerId:        'Reviewer',
  basicSalary:       'Basic Salary',
  housingAllowance:  'Housing Allowance',
  transportAllowance: 'Transport Allowance',
  effectiveDate:     'Effective Date',
  startDate:         'Start Date',
  endDate:           'End Date',
  email:             'Email',
  phone:             'Phone',
  jobTitle:          'Job Title',
  bankName:          'Bank Name',
  bankCode:          'Bank Code',
  bankAccountNumber: 'Account Number',
  nin:               'NIN',
  bvn:               'BVN',
  tin:               'TIN',
};

const MESSAGE_LABEL: Record<string, string> = {
  'Invalid UUID':                        'must be a valid selection',
  'Invalid string':                      'must be in the correct format',
  'Required':                            'is required',
  'String must contain at least':        'is too short',
  'String must contain at most':         'is too long',
};

function shortenMessage(raw: string): string {
  for (const [needle, replacement] of Object.entries(MESSAGE_LABEL)) {
    if (raw.startsWith(needle)) return replacement;
  }
  // Strip the regex pattern noise that Zod tacks onto invalid_format.
  return raw.replace(/\s*\/[^\s]+\/\w*$/, '').replace(/^Invalid string:\s*/, '');
}

function fieldLabel(path: Array<string | number> | undefined): string {
  if (!path || path.length === 0) return 'Form';
  const key = String(path[0]);
  return FIELD_LABEL[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Convert a server error message to a human-readable string. If the
 * message is a Zod issues JSON array, returns one bullet line per
 * field. If it isn't, the original message is returned unchanged.
 */
export function humanizeZodMessage(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed.startsWith('[')) return raw;

  try {
    const issues: ZodIssue[] = JSON.parse(trimmed);
    if (!Array.isArray(issues) || issues.length === 0) return raw;
    // Group by first path segment — multiple issues per field collapse
    // to the first human message; we don't need to surface duplicates.
    const seen = new Set<string>();
    const lines: string[] = [];
    for (const issue of issues) {
      const label = fieldLabel(issue.path);
      if (seen.has(label)) continue;
      seen.add(label);
      const msg = shortenMessage(issue.message ?? 'is invalid');
      lines.push(`${label} ${msg}`);
    }
    if (lines.length === 0) return raw;
    return lines.length === 1 ? lines[0] : `Please fix:\n• ${lines.join('\n• ')}`;
  } catch {
    return raw;
  }
}
