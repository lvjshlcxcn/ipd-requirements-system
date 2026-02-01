"""change_estimated_duration_to_float

Revision ID: 62c050d1ab82
Revises: 20260131_add_rtm_attachments
Create Date: 2026-02-01 20:30:45.223824

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '62c050d1ab82'
down_revision: Union[str, None] = '20260131_add_rtm_attachments'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 将 estimated_duration_months 从 INTEGER 改为 FLOAT 以支持小数天数
    op.execute("ALTER TABLE requirements ALTER COLUMN estimated_duration_months TYPE DOUBLE PRECISION USING estimated_duration_months::DOUBLE PRECISION")


def downgrade() -> None:
    # 回滚：将 estimated_duration_months 从 FLOAT 改回 INTEGER
    op.execute("ALTER TABLE requirements ALTER COLUMN estimated_duration_months TYPE INTEGER USING ROUND(estimated_duration_months)::INTEGER")
