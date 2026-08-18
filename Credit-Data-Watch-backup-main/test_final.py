
import requests, time
BASE = 'http://localhost:8000'

def login(e,p):
    r=requests.post(f'{BASE}/api/v1/auth/login', json={'email': e,'password': p,'gstin': '22AAAAD0000A1Z5'})
    print(f"Login {e} status: {r.status_code}, full response: {r.text}")
    if r.status_code == 200:
        data = r.json()
        if 'data' in data:
            if 'tokens' in data['data'] and 'access_token' in data['data']['tokens']:
                return data['data']['tokens']['access_token']
            elif 'access_token' in data['data']:
                return data['data']['access_token']
    return None

def h(t): return {'Authorization':f'Bearer {t}','Content-Type':'application/json'}

def tasks(label,t):
    r=requests.get(f'{BASE}/api/v1/workflow/my-tasks', headers=h(t))
    if r.status_code!=200: print(f"{label} ERROR {r.status_code}"); return {}
    return r.json().get('data', {})

def toggle(k,v,mt):
    r=requests.post(f'{BASE}/api/v1/admin/settings/roles/{k}/toggle', json={'enabled': v}, headers=h(mt))
    if r.status_code!=200: print(f"Toggle {k} FAILED {r.status_code}")

master=login('payalshinde906@gmail.com','AdminPass123!')
ops=login('ops.test@example.com','Test@12345!')
fin=login('fin.test@example.com','Test@12345!')
legal=login('legal.test@example.com','Test@12345!')
print('Logins OK:', all([master,ops,fin,legal]))

results={}

# ── TEST SET 1: Legal OFF ──────────────────────────────
toggle('legal_role_enabled',False,master)
toggle('financial_role_enabled',False,master)
time.sleep(1.5)

od=tasks('OPS',ops)
fd=tasks('FIN',fin)
ld=tasks('LEGAL',legal)
md=tasks('MASTER',master)

# Ops checks
results['T01_ops_not_locked']            = not od.get('role_disabled')
results['T02_ops_handling_financial']    = od.get('handling_financial') == True
results['T03_ops_handling_legal']        = od.get('handling_legal') == True
results['T04_ops_has_subs']              = 'pending_subscriptions' in od
results['T05_ops_has_po_verify']         = 'po_edit_verification' in od
results['T06_ops_has_biz_requests']      = 'business_check_requests' in od
results['T07_ops_has_support']           = 'support_requests' in od
results['T08_ops_has_legal_notices']     = 'legal_notice_requests' in od

# Role locked checks
results['T09_fin_locked']                = fd.get('role_disabled') == True
results['T10_legal_locked']              = ld.get('role_disabled') == True

# Master checks
results['T11_master_has_subs']           = 'pending_subscriptions' in md
results['T12_master_has_po']             = 'pending_po_approvals' in md
results['T13_master_has_biz']            = 'pending_business_requests' in md
results['T14_master_has_legal']          = 'pending_legal_notices' in md
results['T15_master_has_summary']        = 'summary' in md
results['T16_summary_has_legal_key']     = 'pending_legal' in md.get('summary',{})
results['T17_summary_has_biz_key']       = 'pending_business' in md.get('summary',{})
results['T18_summary_total_is_sum']      = md.get('summary',{}).get('total',0) == (
    md.get('summary',{}).get('pending_subscriptions',0) +
    md.get('summary',{}).get('pending_po_approvals',0) +
    md.get('summary',{}).get('pending_business',0) +
    md.get('summary',{}).get('pending_legal',0)
)

# ── TEST SET 2: Legal ON ──────────────────────────────
toggle('legal_role_enabled',True,master); time.sleep(1.5)
od2=tasks('OPS_legalON',ops)
ld2=tasks('LEGAL_legalON',legal)

results['T19_legal_ON_legal_unlocked']           = not ld2.get('role_disabled')
results['T20_legal_ON_legal_has_requests']       = 'legal_support_requests' in ld2
results['T21_legal_ON_ops_NO_legal_key']         = 'legal_notice_requests' not in od2
results['T22_legal_ON_ops_handling_legal_false'] = od2.get('handling_legal') == False

# ── TEST SET 3: Financial ON ──────────────────────────
toggle('financial_role_enabled',True,master); time.sleep(1.5)
od3=tasks('OPS_finON',ops)
fd2=tasks('FIN_finON',fin)

results['T23_fin_ON_fin_unlocked']               = not fd2.get('role_disabled')
results['T24_fin_ON_fin_has_subs']               = 'pending_subscriptions' in fd2
results['T25_fin_ON_ops_NO_subs']                = 'pending_subscriptions' not in od3
results['T26_fin_ON_ops_handling_fin_false']     = od3.get('handling_financial') == False

# ── TEST SET 4: Ops always has core sections ──────────
toggle('financial_role_enabled',False,master)
toggle('legal_role_enabled',False,master); time.sleep(1)
od4=tasks('OPS_core',ops)
results['T27_ops_always_po']                     = 'po_edit_verification' in od4
results['T28_ops_always_biz']                    = 'business_check_requests' in od4
results['T29_ops_always_support']                = 'support_requests' in od4

# ── TEST SET 5: New legal endpoints ──────────────────
r1=requests.post(f'{BASE}/api/v1/workflow/ops-process-legal/999999',json={'notes':'test'},headers=h(ops))
r2=requests.post(f'{BASE}/api/v1/workflow/master-approve-legal/999999',json={'notes':'test'},headers=h(master))
r3=requests.post(f'{BASE}/api/v1/workflow/reject-legal/999999',json={'reason':'test'},headers=h(master))
results['T30_ops_process_legal_endpoint']        = r1.status_code not in [404,405]
results['T31_master_approve_legal_endpoint']     = r2.status_code not in [404,405]
results['T32_reject_legal_endpoint']             = r3.status_code not in [404,405]

# ── TEST SET 6: Business check master endpoint ────────
r4=requests.post(f'{BASE}/api/v1/business-check/fakeid999/master-approve',json={'save_to_network':False,'notes':'test'},headers=h(master))
results['T33_biz_master_approve_endpoint']       = r4.status_code not in [404,405]

# ── PRINT RESULTS ─────────────────────────────────────
print('\n' + '='*60)
passed=sum(1 for v in results.values() if v)
total=len(results)
for k,v in results.items():
    print(f"{'PASS' if v else 'FAIL'}  {k}")
print('='*60)
print(f'Score: {passed}/{total}')
print('ALL PASSED!' if passed==total else f'{total-passed} FAILED — fix before marking complete')

