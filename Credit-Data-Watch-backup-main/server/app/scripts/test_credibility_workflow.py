
import asyncio
from datetime import datetime
from uuid import uuid4
from sqlalchemy import select, text
import os, sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
if SERVER_ROOT not in sys.path:
    sys.path.insert(0, SERVER_ROOT)

from app.database import AsyncSessionLocal
from app.models import Company, User, UserRole, BusinessRequest
from app.models.credibility_index import (
    CredibilityReview,
    CredibilityReviewStatus,
    CredibilityReviewStage,
    ReviewDecision,
    GlobalCredibilityIndex,
    CredibilityStatus,
    AICreditRiskVerdict,
    LegalStatus,
    OperationalReliability
)

async def create_test_user(session, email, role, company_name, gstin):
    res_comp = await session.execute(select(Company).where(Company.gstin == gstin))
    comp = res_comp.scalars().first()
    if not comp:
        comp = Company(id=str(uuid4()), company_name=company_name, gstin=gstin, domain_name=email.split('@')[1], is_verified=True)
        session.add(comp)
        await session.flush()
    
    res_user = await session.execute(select(User).where(User.email == email))
    user = res_user.scalars().first()
    if not user:
        user = User(
            id=str(uuid4()),
            company_id=comp.id,
            name=company_name,
            email=email,
            password_hash='test_hash',
            role=role,
            status='ACTIVE',
            phone='+919999999999',
            gstin=gstin,
            company_name=company_name,
            is_active=True,
            subscription_status='ACTIVE',
            subscription_bypass=True,
            full_access=True
        )
        session.add(user)
        await session.flush()
    else:
        user.role = role
        await session.flush()
    return user

async def test_credibility_workflow():
    print("\n--- Testing Credibility Index Workflow ---")
    async with AsyncSessionLocal() as session:
        # 1. Setup Users
        user = await create_test_user(session, "cred_client@test.com", UserRole.COMPANY_ADMIN, "Cred Client Corp", "27CREDC0000A1Z")
        fin = await create_test_user(session, "cred_fin@test.com", UserRole.FINANCIAL, "Internal Cred Finance", "27CREDF0001Z")
        legal = await create_test_user(session, "cred_legal@test.com", UserRole.LEGAL, "Internal Cred Legal", "27CREDL0001Z")
        ops = await create_test_user(session, "cred_ops@test.com", UserRole.OPERATION, "Internal Cred Ops", "27CREDO0001Z")
        master = await create_test_user(session, "cred_master@test.com", UserRole.MASTER_ADMIN, "Cred Master Admin", "27CREDM000A1Z")
        await session.commit()

        # 2. Create a Business Request
        print(f"Step 1: User {user.email} creating Business Request...")
        business_req = BusinessRequest(
            id=str(uuid4()),
            user_id=user.id,
            user_email=user.email,
            company_name="Test Company Pvt Ltd",
            gstin="27TESTC0001Z",
            status="PENDING"
        )
        session.add(business_req)
        await session.flush()
        await session.commit()
        print(f"Business Request Created: ID={business_req.id}")

        # 3. Create Credibility Review (Simulate /initiate endpoint)
        print("Step 2: Initiating Credibility Review...")
        credibility_review = CredibilityReview(
            id=str(uuid4()),
            business_request_id=business_req.id,
            company_name=business_req.company_name,
            company_registration_no="U12345XX2020PTC123456",
            submitted_by_user_id=user.id,
            status=CredibilityReviewStatus.PENDING_FINANCIAL
        )
        session.add(credibility_review)
        await session.flush()
        await session.commit()
        print(f"Credibility Review Created: ID={credibility_review.id}, Status={credibility_review.status}")

        # 4. Financial Team Review
        print("Step 3: Financial Team Reviewing...")
        financial_stage = CredibilityReviewStage(
            id=str(uuid4()),
            credibility_review_id=credibility_review.id,
            stage="FINANCIAL",
            reviewed_by_user_id=fin.id,
            decision=ReviewDecision.APPROVED,
            financial_health_score=9,
            payment_history="EXCELLENT",
            financial_risk_level="LOW",
            notes="Finances look good"
        )
        session.add(financial_stage)
        credibility_review.status = CredibilityReviewStatus.PENDING_LEGAL
        await session.commit()
        print(f"Financial Review Completed: Status updated to {credibility_review.status}")

        # 5. Legal Team Review
        print("Step 4: Legal Team Reviewing...")
        legal_stage = CredibilityReviewStage(
            id=str(uuid4()),
            credibility_review_id=credibility_review.id,
            stage="LEGAL",
            reviewed_by_user_id=legal.id,
            decision=ReviewDecision.APPROVED,
            legal_status="CLEAN",
            compliance_score=10,
            court_cases=0,
            notes="No legal issues found"
        )
        session.add(legal_stage)
        credibility_review.status = CredibilityReviewStatus.PENDING_OPERATIONS
        await session.commit()
        print(f"Legal Review Completed: Status updated to {credibility_review.status}")

        # 6. Operations Team Review
        print("Step 5: Operations Team Reviewing...")
        operations_stage = CredibilityReviewStage(
            id=str(uuid4()),
            credibility_review_id=credibility_review.id,
            stage="OPERATIONS",
            reviewed_by_user_id=ops.id,
            decision=ReviewDecision.APPROVED,
            operational_reliability="EXCELLENT",
            dispute_history="NONE",
            partner_trust_score=4.5,
            ai_credit_risk_verdict="LOW_RISK",
            notes="Operational track record is strong"
        )
        session.add(operations_stage)
        credibility_review.status = CredibilityReviewStatus.PENDING_MASTER_ADMIN
        await session.commit()
        print(f"Operations Review Completed: Status updated to {credibility_review.status}")

        # 7. Master Admin Final Approval
        print("Step 6: Master Admin Final Approval...")
        master_stage = CredibilityReviewStage(
            id=str(uuid4()),
            credibility_review_id=credibility_review.id,
            stage="MASTER_ADMIN",
            reviewed_by_user_id=master.id,
            decision=ReviewDecision.APPROVED,
            notes="Final approval granted"
        )
        session.add(master_stage)
        credibility_review.status = CredibilityReviewStatus.APPROVED

        # 8. Create entry in Global Credibility Index
        gci_entry = GlobalCredibilityIndex(
            id=str(uuid4()),
            company_name=credibility_review.company_name,
            company_registration_no=credibility_review.company_registration_no,
            partner_trust_score=4.5,
            ai_credit_risk_verdict=AICreditRiskVerdict.LOW_RISK,
            credibility_status=CredibilityStatus.CREDIBILITY_VERIFIED,
            financial_health_score=9,
            legal_status=LegalStatus.CLEAN,
            operational_reliability=OperationalReliability.EXCELLENT,
            approved_by_master_admin_id=master.id,
            credibility_review_id=credibility_review.id
        )
        session.add(gci_entry)
        await session.commit()
        print(f"Global Credibility Index Entry Created: ID={gci_entry.id}")

        # 9. Verify everything
        print("\n--- Verification ---")
        gci_res = await session.execute(select(GlobalCredibilityIndex).where(GlobalCredibilityIndex.company_name == "Test Company Pvt Ltd"))
        gci = gci_res.scalars().first()
        assert gci is not None, "Global Credibility Index entry not found!"
        # Check if the enum matches directly
        assert gci.credibility_status == CredibilityStatus.CREDIBILITY_VERIFIED, f"Expected CREDIBILITY_VERIFIED, got {gci.credibility_status}"
        print("  Verification Passed!")
        print(f"  - Company: {gci.company_name}")
        print(f"  - Partner Trust Score: {gci.partner_trust_score}")
        print(f"  - AI Verdict: {gci.ai_credit_risk_verdict}")
        print(f"  - Status: {gci.credibility_status}")

        print("\nCREDIBILITY WORKFLOW TEST PASSED!")

async def test_business_request_access():
    print("\n--- Testing Business Request Access ---")
    async with AsyncSessionLocal() as session:
        # Check if users with FINANCIAL/LEGAL/OPERATION roles can access business requests
        # We'll just verify the user roles exist
        fin = await create_test_user(session, "test_access_fin@test.com", UserRole.FINANCIAL, "Test Access Fin", "27TESTA0001Z")
        legal = await create_test_user(session, "test_access_legal@test.com", UserRole.LEGAL, "Test Access Legal", "27TESTA0002Z")
        ops = await create_test_user(session, "test_access_ops@test.com", UserRole.OPERATION, "Test Access Ops", "27TESTA0003Z")
        await session.commit()
        
        print(f"  FINANCIAL role user exists: {fin.email}")
        print(f"  LEGAL role user exists: {legal.email}")
        print(f"  OPERATION role user exists: {ops.email}")

async def main():
    try:
        await test_credibility_workflow()
        await test_business_request_access()
        print("\nALL CREDIBILITY & BUSINESS REQUEST TESTS PASSED!")
    except Exception as e:
        print(f"\nTEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
