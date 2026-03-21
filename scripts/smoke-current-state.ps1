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

  $suffix = Get-Random -Minimum 1000 -Maximum 9999
  $registerPayload = @{
    email = "smoke$suffix@example.com"
    username = "smoke$suffix"
    password = 'Naughtybox123!'
  } | ConvertTo-Json

  $register = Invoke-RestMethod -Uri 'http://localhost:3000/auth/register' -Method Post -ContentType 'application/json' -Body $registerPayload
  Assert-True (-not [string]::IsNullOrWhiteSpace($register.token)) 'Register did not return a token.'
  $results.Add([pscustomobject]@{ case = 'auth.register'; status = 'ok'; detail = $register.user.username })

  $loginPayload = @{
    emailOrUsername = $register.user.username
    password = 'Naughtybox123!'
  } | ConvertTo-Json

  $login = Invoke-RestMethod -Uri 'http://localhost:3000/auth/login' -Method Post -ContentType 'application/json' -Body $loginPayload
  Assert-True ($login.user.id -eq $register.user.id) 'Login returned unexpected user.'
  $headers = @{ Authorization = "Bearer $($login.token)" }
  $results.Add([pscustomobject]@{ case = 'auth.login'; status = 'ok'; detail = $login.user.username })

  $profilePayload = @{
    displayName = 'Smoke Creator'
    slug = "smoke-creator-$suffix"
    bio = 'Smoke test creator profile.'
    accentColor = '#ff5b73'
    tags = @('smoke', 'es')
  } | ConvertTo-Json

  Invoke-RestMethod -Uri 'http://localhost:3000/creator/profile' -Method Put -ContentType 'application/json' -Headers $headers -Body $profilePayload | Out-Null
  $results.Add([pscustomobject]@{ case = 'creator.profile'; status = 'ok'; detail = "slug=smoke-creator-$suffix" })

  $roomPayload = @{
    title = 'Smoke Room'
    description = 'Room created by smoke test.'
    tags = @('obs', 'test')
  } | ConvertTo-Json

  Invoke-RestMethod -Uri 'http://localhost:3000/creator/room' -Method Put -ContentType 'application/json' -Headers $headers -Body $roomPayload | Out-Null
  $dashboard = Invoke-RestMethod -Uri 'http://localhost:3000/creator/dashboard' -Headers $headers
  Assert-True ($dashboard.room.slug -eq "smoke-creator-$suffix") 'Creator room slug mismatch.'
  $results.Add([pscustomobject]@{ case = 'creator.dashboard'; status = 'ok'; detail = $dashboard.room.streamKey })

  $publicRoom = Invoke-RestMethod -Uri "http://localhost:3000/streams/smoke-creator-$suffix"
  Assert-True ($publicRoom.publish.streamKey -eq "smoke-creator-$suffix") 'Public room stream key mismatch.'
  $results.Add([pscustomobject]@{ case = 'streams.detail'; status = 'ok'; detail = $publicRoom.publish.streamKey })

  $results | ConvertTo-Json -Depth 4
}
catch {
  $results.Add([pscustomobject]@{ case = 'failure'; status = 'error'; detail = $_.Exception.Message })
  $results | ConvertTo-Json -Depth 4
  exit 1
}
