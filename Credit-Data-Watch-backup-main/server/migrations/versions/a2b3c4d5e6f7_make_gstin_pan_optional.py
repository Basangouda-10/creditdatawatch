"""make_gstin_pan_optional

Revision ID: a2b3c4d5e6f7
Revises: 69fd97fc9c1d
Create Date: 2026-08-07 00:00:00.000000

Removes the hard "GST / PAN required" DB constraint on a few tables so
these fields can be left blank when creating purchase orders, business
check requests, credit reports, and business profiles.

NOTE: Company.gstin and User.gstin are intentionally left untouched here
(nullable=False, unique). Those are core identity fields used for
company de-duplication, login, and matching across the whole app, and
loosening them requires a much bigger, separate change.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a2b3c4d5e6f7'
down_revision = '69fd97fc9c1d'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        'purchase_orders', 'gstin',
        existing_type=sa.String(length=15),
        nullable=True,
    )
    op.alter_column(
        'business_requests', 'gstin',
        existing_type=sa.String(length=15),
        nullable=True,
    )
    op.alter_column(
        'credit_reports', 'entity_gstin',
        existing_type=sa.String(length=15),
        nullable=True,
    )
    op.alter_column(
        'business_profiles', 'gstin',
        existing_type=sa.String(length=15),
        nullable=True,
    )


def downgrade():
    op.alter_column(
        'business_profiles', 'gstin',
        existing_type=sa.String(length=15),
        nullable=False,
    )
    op.alter_column(
        'credit_reports', 'entity_gstin',
        existing_type=sa.String(length=15),
        nullable=False,
    )
    op.alter_column(
        'business_requests', 'gstin',
        existing_type=sa.String(length=15),
        nullable=False,
    )
    op.alter_column(
        'purchase_orders', 'gstin',
        existing_type=sa.String(length=15),
        nullable=False,
    )
