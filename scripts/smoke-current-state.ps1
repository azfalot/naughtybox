$ErrorActionPreference = 'Stop'

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

function Get-OrCreateUser {
  param(
    [string]$Email,
    [string]$Username,
    [string]$Password
  )

  $registerPayload = @{
    email = $Email
    username = $Username
    password = $Password
  } | ConvertTo-Json

  try {
    return Invoke-RestMethod -Uri 'http://localhost:3000/auth/register' -Method Post -ContentType 'application/json' -Body $registerPayload
  }
  catch {
    $loginPayload = @{
      emailOrUsername = $Username
      password = $Password
    } | ConvertTo-Json

    return Invoke-RestMethod -Uri 'http://localhost:3000/auth/login' -Method Post -ContentType 'application/json' -Body $loginPayload
  }
}

$results = [System.Collections.Generic.List[object]]::new()

try {
  $health = Invoke-RestMethod -Uri 'http://localhost:3000/health'
  Assert-True ($health.status -eq 'ok') 'Backend health check failed.'
  $results.Add([pscustomobject]@{ case = 'health'; status = 'ok'; detail = $health.status })

  $streams = Invoke-RestMethod -Uri 'http://localhost:3000/streams'
  Assert-True ($streams.Count -ge 3) 'Expected at least 3 persisted rooms.'
  $results.Add([pscustomobject]@{ case = 'streams'; status = 'ok'; detail = "rooms=$($streams.Count)" })

  $billing = Invoke-RestMethod -Uri 'http://localhost:3000/streams/meta/billing'
  Assert-True ($billing.providers.Count -ge 1) 'Billing config missing providers.'
  $results.Add([pscustomobject]@{ case = 'billing'; status = 'ok'; detail = "providers=$($billing.providers.Count)" })

  $username = 'smokeviewer'
  $password = 'Naughtybox123!'
  $account = Get-OrCreateUser -Email 'smoke.viewer@naughtybox.local' -Username $username -Password $password

  Assert-True (-not [string]::IsNullOrWhiteSpace($account.token)) 'Auth flow did not return a token.'
  $results.Add([pscustomobject]@{ case = 'auth.register_or_login'; status = 'ok'; detail = $account.user.username })

  $headers = @{ Authorization = "Bearer $($account.token)" }

  $profilePayload = @{
    displayName = 'Smoke Creator'
    slug = 'smoke-validation-room'
    bio = 'Smoke test creator profile.'
    accentColor = '#ff5b73'
    tags = @('smoke', 'es')
  } | ConvertTo-Json

  Invoke-RestMethod -Uri 'http://localhost:3000/creator/profile' -Method Put -ContentType 'application/json' -Headers $headers -Body $profilePayload | Out-Null
  $results.Add([pscustomobject]@{ case = 'creator.profile'; status = 'ok'; detail = 'slug=smoke-validation-room' })

  $roomPayload = @{
    title = 'Smoke Room'
    description = 'Room created by smoke validation.'
    tags = @('obs', 'test')
  } | ConvertTo-Json

  Invoke-RestMethod -Uri 'http://localhost:3000/creator/room' -Method Put -ContentType 'application/json' -Headers $headers -Body $roomPayload | Out-Null
  $dashboard = Invoke-RestMethod -Uri 'http://localhost:3000/creator/dashboard' -Headers $headers
  Assert-True ($dashboard.room.slug -eq 'smoke-validation-room') 'Creator room slug mismatch.'
  $results.Add([pscustomobject]@{ case = 'creator.dashboard'; status = 'ok'; detail = $dashboard.room.streamKey })

  $publicRoom = Invoke-RestMethod -Uri 'http://localhost:3000/streams/smoke-validation-room'
  Assert-True ($publicRoom.publish.streamKey -eq 'smoke-validation-room') 'Public room stream key mismatch.'
  $results.Add([pscustomobject]@{ case = 'streams.detail'; status = 'ok'; detail = $publicRoom.publish.streamKey })

  $results | ConvertTo-Json -Depth 4
}
catch {
  $results.Add([pscustomobject]@{ case = 'failure'; status = 'error'; detail = $_.Exception.Message })
  $results | ConvertTo-Json -Depth 4
  exit 1
}
