"""add sales_invoices tables

Revision ID: 69fd97fc9c1d
Revises: 6f2cd4edd879
Create Date: 2026-07-30 20:07:13.596113

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '69fd97fc9c1d'
down_revision: Union[str, None] = '6f2cd4edd879'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
