param()

$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8000/api/v1'

function TryInvoke($method, $url, $body, $session=$null) {
  try {
    if ($session -ne $null) {
      return Invoke-RestMethod -Uri $url -Method $method -ContentType 'application/json' -Body ($body | ConvertTo-Json) -WebSession $session
    } else {
      return Invoke-RestMethod -Uri $url -Method $method -ContentType 'application/json' -Body ($body | ConvertTo-Json)
    }
  } catch {
    return $_
  }
}

Write-Output 'Test 1: Register Company A (official domain)'
$sessionA = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$res1 = TryInvoke 'POST' "$base/auth/register" @{ company_name='Company A'; email='admin@companya.com'; password='AdminPass123!'; phone='9111111111'; gstin='27AAAAA0000A1Z5' } $sessionA
if ($res1.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Output ('  FAIL: ' + $res1.Exception.Message) } else { Write-Output '  SUCCESS' }

Write-Output 'Test 2: Register with gmail (should fail)'
$res2 = TryInvoke 'POST' "$base/auth/register" @{ company_name='GMail Co'; email='user@gmail.com'; password='AdminPass123!'; phone='9222222222'; gstin='27CCCCD0000C1Z5' }
if ($res2.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Output '  EXPECTED FAIL' } else { Write-Output '  UNEXPECTED SUCCESS' }

Write-Output 'Test 3: Register same GSTIN again (should fail)'
$res3 = TryInvoke 'POST' "$base/auth/register" @{ company_name='Company A'; email='admin2@companya.com'; password='AdminPass123!'; phone='9333333333'; gstin='27AAAAA0000A1Z5' }
if ($res3.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Output '  EXPECTED FAIL' } else { Write-Output '  UNEXPECTED SUCCESS' }

Write-Output 'Test 4: Admin creates invitation'
$inv = TryInvoke 'POST' "$base/admin/invitations" @{ email='finance@companya.com'; role='FINANCE' } $sessionA
if ($inv.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Output ('  FAIL: ' + $inv.Exception.Message); exit 1 }
else { $token = $inv.data.token; Write-Output ('  SUCCESS, token=' + $token) }

Write-Output 'Test 6: Accept invalid invitation (should fail)'
$accWrong = TryInvoke 'POST' "$base/auth/invitations/accept" @{ token='deadbeef'; email='finance@companya.com'; password='EmpPass123!' }
if ($accWrong.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Output '  EXPECTED FAIL' } else { Write-Output '  UNEXPECTED SUCCESS' }

Write-Output 'Accept real invitation (should succeed)'
$accRes = TryInvoke 'POST' "$base/auth/invitations/accept" @{ token=$token; email='finance@companya.com'; password='EmpPass123!' }
if ($accRes.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Output ('  FAIL: ' + $accRes.Exception.Message) } else { Write-Output '  SUCCESS' }

Write-Output 'Register Company B (official domain)'
$sessionB = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$regB = TryInvoke 'POST' "$base/auth/register" @{ company_name='Company B'; email='admin@companyb.com'; password='AdminPass123!'; phone='9444444444'; gstin='27BBBBB0000B1Z5' } $sessionB
if ($regB.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Output ('  FAIL: ' + $regB.Exception.Message) } else { Write-Output '  SUCCESS' }

Write-Output 'Create PO for Company B vendor'
$poRes = TryInvoke 'POST' "$base/purchase-orders" @{ number='PO-001'; vendor_name='Company B'; vendor_gstin='27BBBBB0000B1Z5'; amount=10000; due_date='2026-12-31' } $sessionA
if ($poRes.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Output ('  FAIL: ' + $poRes.Exception.Message) } else { Write-Output '  SUCCESS' }

Write-Output 'Test 7: Ratings check (should succeed)'
$rateRes = TryInvoke 'POST' "$base/ratings/check" @{ counterparty_gstin='27BBBBB0000B1Z5' } $sessionA
if ($rateRes.PSObject.TypeNames[0] -like '*ErrorRecord*') { Write-Output ('  FAIL: ' + $rateRes.Exception.Message) } else { Write-Output '  SUCCESS' }
