"""init

Revision ID: 0ae42e959edb
Revises: 
Create Date: 2026-01-04 20:44:20.963553

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0ae42e959edb'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fresh schema: create core tables in dependency order
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('gstin', sa.String(length=15), nullable=False),
        sa.Column('company_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
    )
    op.create_index('idx_user_gstin_active', 'users', ['gstin', 'is_active'])
    op.create_index('idx_user_email_active', 'users', ['email', 'is_active'])
    op.create_index(op.f('ix_users_created_at'), 'users', ['created_at'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_gstin'), 'users', ['gstin'], unique=True)
    op.create_index(op.f('ix_users_is_active'), 'users', ['is_active'], unique=False)
    op.create_index(op.f('ix_users_phone'), 'users', ['phone'], unique=False)

    op.create_table(
        'subscriptions',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('plan', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('expiry_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
    )
    op.create_index('idx_subscription_user_active', 'subscriptions', ['user_id', 'is_active'])
    op.create_index(op.f('ix_subscriptions_expiry_date'), 'subscriptions', ['expiry_date'], unique=False)
    op.create_index(op.f('ix_subscriptions_is_active'), 'subscriptions', ['is_active'], unique=False)
    op.create_index(op.f('ix_subscriptions_user_id'), 'subscriptions', ['user_id'], unique=False)

    op.create_table(
        'business_profiles',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('registered_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('gstin', sa.String(length=15), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
    )
    op.create_index(op.f('ix_business_profiles_gstin'), 'business_profiles', ['gstin'], unique=False)
    op.create_index(op.f('ix_business_profiles_user_id'), 'business_profiles', ['user_id'], unique=False)

    op.create_table(
        'purchase_orders',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('number', sa.String(length=100), nullable=False),
        sa.Column('vendor_name', sa.String(length=255), nullable=False),
        sa.Column('vendor_gstin', sa.String(length=15), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True, server_default=sa.text("'Open'")),
        sa.Column('document_url', sa.String(length=500), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
    )
    op.create_index('idx_po_user_status', 'purchase_orders', ['user_id', 'status'], unique=False)
    op.create_index('idx_po_vendor_gstin', 'purchase_orders', ['vendor_gstin'], unique=False)
    op.create_index(op.f('ix_purchase_orders_created_at'), 'purchase_orders', ['created_at'], unique=False)
    op.create_index(op.f('ix_purchase_orders_due_date'), 'purchase_orders', ['due_date'], unique=False)
    op.create_index(op.f('ix_purchase_orders_status'), 'purchase_orders', ['status'], unique=False)
    op.create_index(op.f('ix_purchase_orders_user_id'), 'purchase_orders', ['user_id'], unique=False)
    op.create_index(op.f('ix_purchase_orders_vendor_gstin'), 'purchase_orders', ['vendor_gstin'], unique=False)

    op.create_table(
        'defaulter_cases',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('business_name', sa.String(length=255), nullable=False),
        sa.Column('business_gstin', sa.String(length=15), nullable=False),
        sa.Column('invoice_number', sa.String(length=100), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True, server_default=sa.text("'Filed - awaiting review'")),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('documents_drive_folder', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
    )
    op.create_index('idx_defaulter_user_status', 'defaulter_cases', ['user_id', 'status'], unique=False)
    op.create_index('idx_defaulter_business_gstin', 'defaulter_cases', ['business_gstin'], unique=False)
    op.create_index(op.f('ix_defaulter_cases_business_gstin'), 'defaulter_cases', ['business_gstin'], unique=False)
    op.create_index(op.f('ix_defaulter_cases_created_at'), 'defaulter_cases', ['created_at'], unique=False)
    op.create_index(op.f('ix_defaulter_cases_due_date'), 'defaulter_cases', ['due_date'], unique=False)
    op.create_index(op.f('ix_defaulter_cases_status'), 'defaulter_cases', ['status'], unique=False)
    op.create_index(op.f('ix_defaulter_cases_user_id'), 'defaulter_cases', ['user_id'], unique=False)

    op.create_table(
        'credit_reports',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('entity_name', sa.String(length=255), nullable=False),
        sa.Column('entity_gstin', sa.String(length=15), nullable=False),
        sa.Column('credit_score', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True, server_default=sa.text("'Requested'")),
        sa.Column('report_url', sa.String(length=500), nullable=True),
        sa.Column('last_updated', sa.DateTime(timezone=True), nullable=True),
        sa.Column('requested_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
    )
    op.create_index('idx_credit_user_status', 'credit_reports', ['user_id', 'status'], unique=False)
    op.create_index('idx_credit_entity_gstin', 'credit_reports', ['entity_gstin'], unique=False)
    op.create_index(op.f('ix_credit_reports_entity_gstin'), 'credit_reports', ['entity_gstin'], unique=False)
    op.create_index(op.f('ix_credit_reports_requested_at'), 'credit_reports', ['requested_at'], unique=False)
    op.create_index(op.f('ix_credit_reports_status'), 'credit_reports', ['status'], unique=False)
    op.create_index(op.f('ix_credit_reports_user_id'), 'credit_reports', ['user_id'], unique=False)

    op.create_table(
        'settlements',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('case_reference', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True, server_default=sa.text("'Open'")),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('documents_drive_folder', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
    )
    op.create_index('idx_settlement_user_status', 'settlements', ['user_id', 'status'], unique=False)
    op.create_index(op.f('ix_settlements_created_at'), 'settlements', ['created_at'], unique=False)
    op.create_index(op.f('ix_settlements_status'), 'settlements', ['status'], unique=False)
    op.create_index(op.f('ix_settlements_user_id'), 'settlements', ['user_id'], unique=False)


def downgrade() -> None:
    # Drop in reverse dependency order
    op.drop_index(op.f('ix_settlements_user_id'), table_name='settlements')
    op.drop_index(op.f('ix_settlements_status'), table_name='settlements')
    op.drop_index(op.f('ix_settlements_created_at'), table_name='settlements')
    op.drop_index('idx_settlement_user_status', table_name='settlements')
    op.drop_table('settlements')

    op.drop_index(op.f('ix_credit_reports_user_id'), table_name='credit_reports')
    op.drop_index(op.f('ix_credit_reports_status'), table_name='credit_reports')
    op.drop_index(op.f('ix_credit_reports_requested_at'), table_name='credit_reports')
    op.drop_index(op.f('ix_credit_reports_entity_gstin'), table_name='credit_reports')
    op.drop_index('idx_credit_user_status', table_name='credit_reports')
    op.drop_index('idx_credit_entity_gstin', table_name='credit_reports')
    op.drop_table('credit_reports')

    op.drop_index(op.f('ix_defaulter_cases_user_id'), table_name='defaulter_cases')
    op.drop_index(op.f('ix_defaulter_cases_status'), table_name='defaulter_cases')
    op.drop_index(op.f('ix_defaulter_cases_due_date'), table_name='defaulter_cases')
    op.drop_index(op.f('ix_defaulter_cases_created_at'), table_name='defaulter_cases')
    op.drop_index(op.f('ix_defaulter_cases_business_gstin'), table_name='defaulter_cases')
    op.drop_index('idx_defaulter_user_status', table_name='defaulter_cases')
    op.drop_index('idx_defaulter_business_gstin', table_name='defaulter_cases')
    op.drop_table('defaulter_cases')

    op.drop_index(op.f('ix_purchase_orders_vendor_gstin'), table_name='purchase_orders')
    op.drop_index(op.f('ix_purchase_orders_user_id'), table_name='purchase_orders')
    op.drop_index(op.f('ix_purchase_orders_status'), table_name='purchase_orders')
    op.drop_index(op.f('ix_purchase_orders_due_date'), table_name='purchase_orders')
    op.drop_index(op.f('ix_purchase_orders_created_at'), table_name='purchase_orders')
    op.drop_index('idx_po_vendor_gstin', table_name='purchase_orders')
    op.drop_index('idx_po_user_status', table_name='purchase_orders')
    op.drop_table('purchase_orders')

    op.drop_index(op.f('ix_business_profiles_user_id'), table_name='business_profiles')
    op.drop_index(op.f('ix_business_profiles_gstin'), table_name='business_profiles')
    op.drop_table('business_profiles')

    op.drop_index(op.f('ix_subscriptions_user_id'), table_name='subscriptions')
    op.drop_index(op.f('ix_subscriptions_is_active'), table_name='subscriptions')
    op.drop_index(op.f('ix_subscriptions_expiry_date'), table_name='subscriptions')
    op.drop_index('idx_subscription_user_active', table_name='subscriptions')
    op.drop_table('subscriptions')

    op.drop_index(op.f('ix_users_phone'), table_name='users')
    op.drop_index(op.f('ix_users_is_active'), table_name='users')
    op.drop_index(op.f('ix_users_gstin'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_created_at'), table_name='users')
    op.drop_index('idx_user_gstin_active', table_name='users')
    op.drop_index('idx_user_email_active', table_name='users')
    op.drop_table('users')
