param(
  [Parameter(Mandatory = $true, Position = 0)]
  [ValidateSet("install", "status", "pause", "resume", "run", "uninstall")]
  [string]$Action,

  [Parameter(Mandatory = $true)]
  [string]$Repository
)

$ErrorActionPreference = "Stop"
$TaskName = "WebClipsAutoSync"
$Repository = [System.IO.Path]::GetFullPath($Repository)
$Node = (Get-Command node.exe -ErrorAction Stop).Source
$Cli = Join-Path $Repository "sync\cli.mjs"
$Runner = Join-Path $Repository "sync\task-runner.ps1"
$PowerShell = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$Description = "WebClipsAutoSync managed task for $Repository"

function Get-WebClipsTask {
  try {
    Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
  } catch {
    if (
      $_.Exception.HResult -eq -2147217405 -or
      $_.FullyQualifiedErrorId -match "0x80041003" -or
      $_.CategoryInfo.Category -eq "PermissionDenied"
    ) {
      throw "Task Scheduler query denied for the current Windows identity. Run this command as the interactive user who installed $TaskName."
    }
    if (
      $_.Exception.HResult -eq -2147024894 -or
      $_.FullyQualifiedErrorId -match "0x80070002"
    ) {
      return $null
    }
    if ($_.Exception.Message -match "cannot find") {
      return $null
    }
    throw
  }
}

function Write-TaskStatus([string]$Operation) {
  $task = Get-WebClipsTask
  if ($null -eq $task) {
    [ordered]@{
      ok = $true
      action = $Operation
      taskName = $TaskName
      installed = $false
    } | ConvertTo-Json -Compress
    return
  }
  $info = Get-ScheduledTaskInfo -TaskName $TaskName
  [ordered]@{
    ok = $true
    action = $Operation
    taskName = $TaskName
    installed = $true
    enabled = $task.State -ne "Disabled"
    state = [string]$task.State
    lastRunTime = $info.LastRunTime.ToString("o")
    lastTaskResult = $info.LastTaskResult
    nextRunTime = $info.NextRunTime.ToString("o")
    executable = $task.Actions[0].Execute
    arguments = $task.Actions[0].Arguments
    workingDirectory = $task.Actions[0].WorkingDirectory
    principalLogonType = [string]$task.Principal.LogonType
    principalRunLevel = [string]$task.Principal.RunLevel
    description = $task.Description
  } | ConvertTo-Json -Compress
}

switch ($Action) {
  "install" {
    if (-not (Test-Path -LiteralPath $Cli -PathType Leaf) -or -not (Test-Path -LiteralPath $Runner -PathType Leaf)) {
      throw "Sync CLI or task runner is missing"
    }
    $existing = Get-WebClipsTask
    if ($null -ne $existing -and $existing.Description -ne $Description) {
      throw "A task named $TaskName exists but is not owned by this repository"
    }
    $scheduledAction = New-ScheduledTaskAction `
      -Execute $PowerShell `
      -Argument "-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$Runner`" -Node `"$Node`" -Cli `"$Cli`" -Repository `"$Repository`"" `
      -WorkingDirectory $Repository
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
      -RepetitionInterval (New-TimeSpan -Minutes 1)
    $principal = New-ScheduledTaskPrincipal `
      -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) `
      -LogonType Interactive `
      -RunLevel Limited
    $settings = New-ScheduledTaskSettingsSet `
      -Hidden `
      -MultipleInstances IgnoreNew `
      -StartWhenAvailable `
      -AllowStartIfOnBatteries `
      -DontStopIfGoingOnBatteries `
      -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
    $definition = New-ScheduledTask `
      -Action $scheduledAction `
      -Trigger $trigger `
      -Principal $principal `
      -Settings $settings `
      -Description $Description
    Register-ScheduledTask -TaskName $TaskName -InputObject $definition -Force | Out-Null
    Write-TaskStatus "install"
  }
  "status" {
    Write-TaskStatus "status"
  }
  "pause" {
    Disable-ScheduledTask -TaskName $TaskName | Out-Null
    Write-TaskStatus "pause"
  }
  "resume" {
    Enable-ScheduledTask -TaskName $TaskName | Out-Null
    Write-TaskStatus "resume"
  }
  "run" {
    Start-ScheduledTask -TaskName $TaskName
    Start-Sleep -Milliseconds 750
    Write-TaskStatus "run"
  }
  "uninstall" {
    $task = Get-WebClipsTask
    if ($null -ne $task) {
      Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }
    Write-TaskStatus "uninstall"
  }
}
