$filePath = "c:\Users\Daniel Idonor\Suler EMS\src\components\modals\WorkforceModals.tsx"
$lines = [System.IO.File]::ReadAllLines($filePath, [System.Text.Encoding]::UTF8)

# Replace lines 581-589 (0-indexed) with DatePicker component
$newLines = New-Object System.Collections.Generic.List[string]
for ($i = 0; $i -lt $lines.Length; $i++) {
  if ($i -eq 581) {
    $newLines.Add('                   <DatePicker')
    $newLines.Add('                     label="Start Date"')
    $newLines.Add('                     value={formData.startDate}')
    $newLines.Add('                     onChange={val => setFormData({...formData, startDate: val})}')
    $newLines.Add('                   />')
    # Skip lines 581-589
    $i = 589
  } else {
    $newLines.Add($lines[$i])
  }
}

[System.IO.File]::WriteAllLines($filePath, $newLines.ToArray(), [System.Text.Encoding]::UTF8)
Write-Host "Done! Replaced lines 581-589 with DatePicker component."

# Verify
$verifyLines = [System.IO.File]::ReadAllLines($filePath, [System.Text.Encoding]::UTF8)
for ($i = 579; $i -le 592; $i++) {
  Write-Host "[$i]: $($verifyLines[$i])"
}
