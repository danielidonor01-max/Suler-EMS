$filePath = "c:\Users\Daniel Idonor\Suler EMS\src\app\(dashboard)\settings\compliance\page.tsx"
$lines = [System.IO.File]::ReadAllLines($filePath, [System.Text.Encoding]::UTF8)

# Remove line 4 (0-indexed) which is the misplaced import
$newLines = New-Object System.Collections.Generic.List[string]
for ($i = 0; $i -lt $lines.Length; $i++) {
  if ($i -eq 4 -and $lines[$i] -match "DatePicker") {
    # Skip this misplaced import line
    continue
  }
  $newLines.Add($lines[$i])
}

# Now find line with 'import Link from' and insert DatePicker import after it
$finalLines = New-Object System.Collections.Generic.List[string]
$inserted = $false
foreach ($line in $newLines) {
  $finalLines.Add($line)
  if (-not $inserted -and $line -match "import Link from") {
    $finalLines.Add("import { DatePicker } from '@/components/forms/DatePicker';")
    $inserted = $true
  }
}

[System.IO.File]::WriteAllLines($filePath, $finalLines.ToArray(), [System.Text.Encoding]::UTF8)
Write-Host "Fixed import placement!"

$verify = [System.IO.File]::ReadAllLines($filePath, [System.Text.Encoding]::UTF8)
for ($i = 0; $i -le 30; $i++) {
  Write-Host "[$i]: $($verify[$i])"
}
