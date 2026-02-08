"""Create vote_results table for archiving voting results

Revision ID: 20260204_create_vote_results
Revises: 20260204_add_assigned_voters
Create Date: 2026-02-04 22:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260204_create_vote_results'
down_revision: Union[str, None] = '20260204_add_assigned_voters'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create vote_results table
    op.create_table(
        'vote_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('meeting_id', sa.Integer(), nullable=False),
        sa.Column('requirement_id', sa.Integer(), nullable=False),
        sa.Column('requirement_title', sa.String(), nullable=True),
        sa.Column('vote_statistics', postgresql.JSONB(), nullable=False),  # 使用 JSONB 而不是 JSON
        sa.Column('archived_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['meeting_id'], ['requirement_review_meetings.id'], name=op.f('vote_results_meeting_id_fkey'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requirement_id'], ['requirements.id'], name=op.f('vote_results_requirement_id_fkey'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('vote_results_pkey'))
    )
    op.create_index(op.f('ix_vote_results_id'), 'vote_results', ['id'], unique=False)
    op.create_index(op.f('ix_vote_results_tenant_id'), 'vote_results', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_vote_results_meeting_id'), 'vote_results', ['meeting_id'], unique=False)
    op.create_index(op.f('ix_vote_results_requirement_id'), 'vote_results', ['requirement_id'], unique=False)
    op.create_index(op.f('ix_vote_results_tenant_meeting'), 'vote_results', ['tenant_id', 'meeting_id'], unique=False)
    op.create_index(op.f('ix_vote_results_archived_at'), 'vote_results', ['archived_at'], unique=False)


def downgrade() -> None:
    # Drop vote_results table
    op.drop_index(op.f('ix_vote_results_archived_at'), table_name='vote_results')
    op.drop_index(op.f('ix_vote_results_tenant_meeting'), table_name='vote_results')
    op.drop_index(op.f('ix_vote_results_requirement_id'), table_name='vote_results')
    op.drop_index(op.f('ix_vote_results_meeting_id'), table_name='vote_results')
    op.drop_index(op.f('ix_vote_results_tenant_id'), table_name='vote_results')
    op.drop_index(op.f('ix_vote_results_id'), table_name='vote_results')
    op.drop_table('vote_results')
