"""add membership payment system

Revision ID: a1b2c3d4e5f6
Revises: f5g6h7i8j9k0
Create Date: 2026-01-18 21:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f5g6h7i8j9k0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add duration_type column to plans table first
    op.add_column('plans', sa.Column('duration_type', sa.String(length=20), nullable=True, server_default='monthly'))
    op.create_index('idx_plan_duration', 'plans', ['duration_type', 'is_active'], unique=False)
    
    # Create payments table (must be created before subscriptions references it)
    op.create_table('payments',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('plan_id', sa.String(length=36), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='INR'),
        sa.Column('payment_method', sa.String(length=20), nullable=False),
        sa.Column('payment_provider', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('transaction_id', sa.String(length=255), nullable=True),
        sa.Column('reference_id', sa.String(length=255), nullable=False),
        sa.Column('gateway_order_id', sa.String(length=255), nullable=True),
        sa.Column('gateway_payment_id', sa.String(length=255), nullable=True),
        sa.Column('failure_reason', sa.Text(), nullable=True),
        sa.Column('payment_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True, server_default='{}'),
        sa.Column('initiated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['plan_id'], ['plans.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_payments_id', 'payments', ['id'], unique=False)
    op.create_index('ix_payments_user_id', 'payments', ['user_id'], unique=False)
    op.create_index('ix_payments_reference_id', 'payments', ['reference_id'], unique=True)
    op.create_index('ix_payments_transaction_id', 'payments', ['transaction_id'], unique=True)
    op.create_index('idx_payment_user_status', 'payments', ['user_id', 'status'], unique=False)
    op.create_index('idx_payment_status_created', 'payments', ['status', 'created_at'], unique=False)
    
    # Add status column to subscriptions table
    op.add_column('subscriptions', sa.Column('status', sa.String(length=20), nullable=True, server_default='active'))
    op.create_index('idx_subscription_status', 'subscriptions', ['status'], unique=False)
    
    # Add payment_id column to subscriptions table (after payments table is created)
    op.add_column('subscriptions', sa.Column('payment_id', sa.String(length=36), nullable=True))
    op.create_foreign_key(
        'fk_subscriptions_payment_id',
        'subscriptions', 'payments',
        ['payment_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_index('ix_subscriptions_payment_id', 'subscriptions', ['payment_id'], unique=False)
    
    # Create user_settings table
    op.create_table('user_settings',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('theme_preference', sa.String(length=20), nullable=False, server_default='system'),
        sa.Column('language', sa.String(length=10), nullable=False, server_default='en'),
        sa.Column('notifications_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('ix_user_settings_id', 'user_settings', ['id'], unique=False)
    op.create_index('ix_user_settings_user_id', 'user_settings', ['user_id'], unique=True)
    op.create_index('idx_user_settings_user', 'user_settings', ['user_id'], unique=False)


def downgrade() -> None:
    # Drop user_settings table
    op.drop_index('idx_user_settings_user', table_name='user_settings')
    op.drop_index('ix_user_settings_user_id', table_name='user_settings')
    op.drop_index('ix_user_settings_id', table_name='user_settings')
    op.drop_table('user_settings')
    
    # Drop payments table
    op.drop_index('idx_payment_status_created', table_name='payments')
    op.drop_index('idx_payment_user_status', table_name='payments')
    op.drop_index('ix_payments_transaction_id', table_name='payments')
    op.drop_index('ix_payments_reference_id', table_name='payments')
    op.drop_index('ix_payments_user_id', table_name='payments')
    op.drop_index('ix_payments_id', table_name='payments')
    op.drop_table('payments')
    
    # Remove duration_type from plans
    op.drop_index('idx_plan_duration', table_name='plans')
    op.drop_column('plans', 'duration_type')
    
    # Remove payment_id and status from subscriptions
    op.drop_index('ix_subscriptions_payment_id', table_name='subscriptions')
    op.drop_constraint('fk_subscriptions_payment_id', 'subscriptions', type_='foreignkey')
    op.drop_column('subscriptions', 'payment_id')
    op.drop_index('idx_subscription_status', table_name='subscriptions')
    op.drop_column('subscriptions', 'status')
