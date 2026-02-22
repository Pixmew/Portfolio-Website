$projectsDir = Join-Path $PSScriptRoot "assets\projects"
$outputFile = Join-Path $PSScriptRoot "assets\projects_list.json"

# Load existing order if available
$existingProjects = @()
if (Test-Path $outputFile) {
    try {
        $existingContent = Get-Content $outputFile -Raw | ConvertFrom-Json
        if ($existingContent -is [array]) {
            $existingProjects = $existingContent
        }
        elseif ($existingContent -ne $null) {
            $existingProjects = @($existingContent)
        }
    }
    catch {
        Write-Host "Could not parse existing projects_list.json. Starting fresh." -ForegroundColor Yellow
    }
}

# Load folders
$scannedProjects = @{}
if (Test-Path $projectsDir) {
    $folders = Get-ChildItem -Path $projectsDir -Directory
    foreach ($folder in $folders) {
        $dataFile = Join-Path $folder.FullName "data.json"
        
        if (Test-Path $dataFile) {
            try {
                $content = Get-Content $dataFile -Raw | ConvertFrom-Json
                
                $projectObj = @{
                    id          = $folder.Name
                    title       = $content.title
                    description = $content.description
                    videoId     = $content.videoId
                    category    = $content.category
                    tags        = $content.tags
                }
                
                $scannedProjects[$folder.Name] = $projectObj
            }
            catch {
                Write-Host "Error parsing data.json in $($folder.Name)" -ForegroundColor Red
            }
        }
        else {
            Write-Host "Warning: No data.json found in $($folder.Name)" -ForegroundColor Yellow
        }
    }
}
else {
    Write-Host "Error: Directory $projectsDir does not exist." -ForegroundColor Red
    exit
}

$finalProjects = @()

# 1. Update existing projects and preserve order
foreach ($ep in $existingProjects) {
    $id = $ep.id
    if ($scannedProjects.ContainsKey($id)) {
        # Update with new data from folder but keep it in this spot in the list
        $finalProjects += $scannedProjects[$id]
        $scannedProjects.Remove($id)
    }
}

# 2. Append any NEW projects found in folders to the end
foreach ($key in $scannedProjects.Keys) {
    $finalProjects += $scannedProjects[$key]
}

$finalProjects | ConvertTo-Json -Depth 10 | Set-Content $outputFile -Encoding UTF8
Write-Host "Successfully generated projects_list.json retaining manual sort order with $($finalProjects.Length) projects!" -ForegroundColor Green
