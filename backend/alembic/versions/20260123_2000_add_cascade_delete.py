"""add cascade delete for insight storyboards

Revision ID: add_cascade_delete
Revises: 20260123_1200_add_insight_number
Create Date: 2026-01-23 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_cascade_delete'
down_revision: Union[str, None] = '20260123_1200_add_insight_number'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing foreign key constraint
    op.drop_constraint('user_storyboards_insight_id_fkey', 'user_storyboards', type_='foreignkey')

    # Recreate with CASCADE delete
    op.create_foreign_key(
        'user_storyboards_insight_id_fkey',
        'user_storyboards',
        'insight_analyses',
        ['insight_id'],
        ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # Revert to original constraint without CASCADE
    op.drop_constraint('user_storyboards_insight_id_fkey', 'user_storyboards', type_='foreignkey')

    op.create_foreign_key(
        'user_storyboards_insight_id_fkey',
        'user_storyboards',
        'insight_analyses',
        ['insight_id'],
        ['id']
    )
