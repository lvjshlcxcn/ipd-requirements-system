"""Add assigned_voter_ids to requirement_review_meeting_requirements

Revision ID: 20260204_add_assigned_voters
Revises: 20260203_review_meetings
Create Date: 2026-02-04 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260204_add_assigned_voters'
down_revision: Union[str, None] = '20260203_review_meetings'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add assigned_voter_ids column to requirement_review_meeting_requirements
    op.add_column(
        'requirement_review_meeting_requirements',
        sa.Column('assigned_voter_ids', postgresql.JSONB(), nullable=True)
    )


def downgrade() -> None:
    # Remove assigned_voter_ids column
    op.drop_column('requirement_review_meeting_requirements', 'assigned_voter_ids')
