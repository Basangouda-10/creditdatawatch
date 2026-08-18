"""merge heads

Revision ID: dd6cc9679f65
Revises: 126b146b34b0, a1b2c3d4e5f6
Create Date: 2026-04-07 18:03:26.692164

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dd6cc9679f65'
down_revision: Union[str, None] = ('126b146b34b0', 'a1b2c3d4e5f6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
