param()

$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8000/api/v1'

function TryInvoke($method, $url, $body=$null, $session=$null) {
  try {
    if ($session -ne $null) {
      if ($body -ne $null) {
        return Invoke-RestMethod -Uri $url -Method $method -ContentType 'application/json' -Body ($body | ConvertTo-Json) -WebSession $session
      } else {
        return Invoke-RestMethod -Uri $url -Method $method -WebSession $session
      }
    } else {
      if ($body -ne $null) {
        return Invoke-RestMethod -Uri $url -Method $method -ContentType 'application/json' -Body ($body | ConvertTo-Json)
      } else {
        return Invoke-RestMethod -Uri $url -Method $method
      }
    }
  } catch {
    return $_
  }
}

Write-Host "=== E2E: Admin bypass, invitation flow, PO gating ==="

# 1) Admin login
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$adminLogin = TryInvoke 'POST' "$base/auth/login" @{ email='payalshinde906@gmail.com'; password='AdminPass123!'; gstin='22AAAAD0000A1Z5' } $adminSession
if ($adminLogin.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Host "Admin login FAIL: $($adminLogin.Exception.Message)"; exit 1 } else { Write-Host "Admin login OK" }

# 2) Admin creates invitation (expiry_hours=2) for gmail domain (matches company domain)
$invRes = TryInvoke 'POST' "$base/admin/invitations" @{ email='employee@gmail.com'; role='FINANCE'; expiry_hours=2 } $adminSession
if ($invRes.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Host "Invite FAIL: $($invRes.Exception.Message)"; exit 1 }
$token = $invRes.data.token
Write-Host "Invitation token: $token"

# 3) Accept invitation (employee)
$accRes = TryInvoke 'POST' "$base/auth/invitations/accept" @{ token=$token; email='employee@gmail.com'; password='EmpPass123!' }
if ($accRes.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Host "Accept FAIL: $($accRes.Exception.Message)"; exit 1 } else { Write-Host "Employee account created" }

# 4) Employee login
$empSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$empLogin = TryInvoke 'POST' "$base/auth/login" @{ email='employee@gmail.com'; password='EmpPass123!' } $empSession
if ($empLogin.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Host "Employee login FAIL: $($empLogin.Exception.Message)"; exit 1 } else { Write-Host "Employee login OK" }

# 5) Employee tries to create PO (should be blocked)
$poBodyEmp = @{ number='PO-TEST-001'; vendor_name='Vendor X'; vendor_gstin='27BBBBB0000B1Z5'; amount=5000; due_date='2026-12-31' }
$poResEmp = TryInvoke 'POST' "$base/purchase-orders" $poBodyEmp $empSession
if ($poResEmp.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Host "Employee PO blocked (EXPECTED)" } else { Write-Host "Employee PO created (UNEXPECTED)"; exit 1 }

# 6) Admin creates PO (should succeed)
$poBodyAdmin = @{ number='PO-ADMIN-001'; vendor_name='Vendor Y'; vendor_gstin='27CCCCD0000C1Z5'; amount=7000; due_date='2026-12-31' }
$poResAdmin = TryInvoke 'POST' "$base/purchase-orders" $poBodyAdmin $adminSession
if ($poResAdmin.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Host "Admin PO FAIL: $($poResAdmin.Exception.Message)"; exit 1 } else { Write-Host "Admin PO created (OK)" }

# 7) Admin list invitations (should show pending/accepted)
$listRes = TryInvoke 'GET' "$base/admin/invitations" $null $adminSession
if ($listRes.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Host "List invitations FAIL: $($listRes.Exception.Message)" } else { Write-Host "Invitations listed: $($listRes.data.Count)" }

Write-Host "=== E2E tests completed successfully ==="
