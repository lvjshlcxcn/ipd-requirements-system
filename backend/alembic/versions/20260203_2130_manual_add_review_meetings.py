"""Add requirement review meeting tables

Revision ID: 20260203_review_meetings
Revises: 20260202_fix_ipd_columns
Create Date: 2026-02-03 21:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260203_review_meetings'
down_revision: Union[str, None] = '20260202_fix_ipd_columns'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create requirement_review_meetings table
    op.create_table(
        'requirement_review_meetings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('meeting_no', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('moderator_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='scheduled'),
        sa.Column('meeting_settings', postgresql.JSONB(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name=op.f('requirement_review_meetings_created_by_fkey'), ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['moderator_id'], ['users.id'], name=op.f('requirement_review_meetings_moderator_id_fkey'), ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id', name=op.f('requirement_review_meetings_pkey')),
        sa.UniqueConstraint('meeting_no', name=op.f('uq_requirement_review_meetings_meeting_no'))
    )
    op.create_index(op.f('ix_requirement_review_meetings_id'), 'requirement_review_meetings', ['id'], unique=False)
    op.create_index(op.f('ix_requirement_review_meetings_meeting_no'), 'requirement_review_meetings', ['meeting_no'], unique=False)
    op.create_index(op.f('ix_requirement_review_meetings_scheduled_at'), 'requirement_review_meetings', ['scheduled_at'], unique=False)
    op.create_index(op.f('ix_requirement_review_meetings_status'), 'requirement_review_meetings', ['status'], unique=False)
    op.create_index(op.f('ix_requirement_review_meetings_tenant_id'), 'requirement_review_meetings', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_review_meetings_tenant_status'), 'requirement_review_meetings', ['tenant_id', 'status', 'scheduled_at'], unique=False)
    op.create_index(op.f('ix_review_meetings_tenant_moderator'), 'requirement_review_meetings', ['tenant_id', 'moderator_id'], unique=False)

    # Create requirement_review_meeting_attendees table
    op.create_table(
        'requirement_review_meeting_attendees',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('meeting_id', sa.Integer(), nullable=False),
        sa.Column('attendee_id', sa.Integer(), nullable=False),
        sa.Column('attendance_status', sa.String(length=20), nullable=False, server_default='invited'),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['attendee_id'], ['users.id'], name=op.f('requirement_review_meeting_attendees_attendee_id_fkey'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['meeting_id'], ['requirement_review_meetings.id'], name=op.f('requirement_review_meeting_attendees_meeting_id_fkey'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('requirement_review_meeting_attendees_pkey')),
        sa.UniqueConstraint('meeting_id', 'attendee_id', name=op.f('uq_meeting_attendee'))
    )
    op.create_index(op.f('ix_requirement_review_meeting_attendees_id'), 'requirement_review_meeting_attendees', ['id'], unique=False)
    op.create_index(op.f('ix_requirement_review_meeting_attendees_attendee_id'), 'requirement_review_meeting_attendees', ['attendee_id'], unique=False)
    op.create_index(op.f('ix_requirement_review_meeting_attendees_meeting_id'), 'requirement_review_meeting_attendees', ['meeting_id'], unique=False)
    op.create_index(op.f('ix_requirement_review_meeting_attendees_tenant_id'), 'requirement_review_meeting_attendees', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_meeting_attendees_tenant_meeting'), 'requirement_review_meeting_attendees', ['tenant_id', 'meeting_id'], unique=False)
    op.create_index(op.f('ix_meeting_attendees_tenant_user'), 'requirement_review_meeting_attendees', ['tenant_id', 'attendee_id'], unique=False)

    # Create requirement_review_meeting_requirements table
    op.create_table(
        'requirement_review_meeting_requirements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('meeting_id', sa.Integer(), nullable=False),
        sa.Column('requirement_id', sa.Integer(), nullable=False),
        sa.Column('review_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('meeting_notes', sa.Text(), nullable=True),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['meeting_id'], ['requirement_review_meetings.id'], name=op.f('requirement_review_meeting_requirements_meeting_id_fkey'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requirement_id'], ['requirements.id'], name=op.f('requirement_review_meeting_requirements_requirement_id_fkey'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('requirement_review_meeting_requirements_pkey')),
        sa.UniqueConstraint('meeting_id', 'requirement_id', name=op.f('uq_meeting_requirement'))
    )
    op.create_index(op.f('ix_requirement_review_meeting_requirements_id'), 'requirement_review_meeting_requirements', ['id'], unique=False)
    op.create_index(op.f('ix_requirement_review_meeting_requirements_meeting_id'), 'requirement_review_meeting_requirements', ['meeting_id'], unique=False)
    op.create_index(op.f('ix_requirement_review_meeting_requirements_requirement_id'), 'requirement_review_meeting_requirements', ['requirement_id'], unique=False)
    op.create_index(op.f('ix_requirement_review_meeting_requirements_tenant_id'), 'requirement_review_meeting_requirements', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_meeting_reqs_tenant_meeting'), 'requirement_review_meeting_requirements', ['tenant_id', 'meeting_id', 'review_order'], unique=False)

    # Create requirement_review_votes table
    op.create_table(
        'requirement_review_votes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('meeting_id', sa.Integer(), nullable=False),
        sa.Column('requirement_id', sa.Integer(), nullable=False),
        sa.Column('voter_id', sa.Integer(), nullable=False),
        sa.Column('vote_option', sa.String(length=20), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['meeting_id'], ['requirement_review_meetings.id'], name=op.f('requirement_review_votes_meeting_id_fkey'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requirement_id'], ['requirements.id'], name=op.f('requirement_review_votes_requirement_id_fkey'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['voter_id'], ['users.id'], name=op.f('requirement_review_votes_voter_id_fkey'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('requirement_review_votes_pkey')),
        sa.UniqueConstraint('meeting_id', 'requirement_id', 'voter_id', name=op.f('uq_meeting_requirement_voter'))
    )
    op.create_index(op.f('ix_requirement_review_votes_id'), 'requirement_review_votes', ['id'], unique=False)
    op.create_index(op.f('ix_requirement_review_votes_meeting_id'), 'requirement_review_votes', ['meeting_id'], unique=False)
    op.create_index(op.f('ix_requirement_review_votes_requirement_id'), 'requirement_review_votes', ['requirement_id'], unique=False)
    op.create_index(op.f('ix_requirement_review_votes_tenant_id'), 'requirement_review_votes', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_requirement_review_votes_voter_id'), 'requirement_review_votes', ['voter_id'], unique=False)
    op.create_index(op.f('ix_requirement_review_votes_vote_option'), 'requirement_review_votes', ['vote_option'], unique=False)
    op.create_index(op.f('ix_review_votes_meeting_req_option'), 'requirement_review_votes', ['meeting_id', 'requirement_id', 'vote_option'], unique=False)
    op.create_index(op.f('ix_review_votes_tenant_meeting'), 'requirement_review_votes', ['tenant_id', 'meeting_id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order due to foreign keys
    op.drop_index(op.f('ix_review_votes_tenant_meeting'), table_name='requirement_review_votes')
    op.drop_index(op.f('ix_review_votes_meeting_req_option'), table_name='requirement_review_votes')
    op.drop_index(op.f('ix_requirement_review_votes_vote_option'), table_name='requirement_review_votes')
    op.drop_index(op.f('ix_requirement_review_votes_voter_id'), table_name='requirement_review_votes')
    op.drop_index(op.f('ix_requirement_review_votes_tenant_id'), table_name='requirement_review_votes')
    op.drop_index(op.f('ix_requirement_review_votes_requirement_id'), table_name='requirement_review_votes')
    op.drop_index(op.f('ix_requirement_review_votes_meeting_id'), table_name='requirement_review_votes')
    op.drop_index(op.f('ix_requirement_review_votes_id'), table_name='requirement_review_votes')
    op.drop_table('requirement_review_votes')

    op.drop_index(op.f('ix_meeting_reqs_tenant_meeting'), table_name='requirement_review_meeting_requirements')
    op.drop_index(op.f('ix_requirement_review_meeting_requirements_tenant_id'), table_name='requirement_review_meeting_requirements')
    op.drop_index(op.f('ix_requirement_review_meeting_requirements_requirement_id'), table_name='requirement_review_meeting_requirements')
    op.drop_index(op.f('ix_requirement_review_meeting_requirements_meeting_id'), table_name='requirement_review_meeting_requirements')
    op.drop_index(op.f('ix_requirement_review_meeting_requirements_id'), table_name='requirement_review_meeting_requirements')
    op.drop_table('requirement_review_meeting_requirements')

    op.drop_index(op.f('ix_meeting_attendees_tenant_user'), table_name='requirement_review_meeting_attendees')
    op.drop_index(op.f('ix_meeting_attendees_tenant_meeting'), table_name='requirement_review_meeting_attendees')
    op.drop_index(op.f('ix_requirement_review_meeting_attendees_tenant_id'), table_name='requirement_review_meeting_attendees')
    op.drop_index(op.f('ix_requirement_review_meeting_attendees_meeting_id'), table_name='requirement_review_meeting_attendees')
    op.drop_index(op.f('ix_requirement_review_meeting_attendees_attendee_id'), table_name='requirement_review_meeting_attendees')
    op.drop_index(op.f('ix_requirement_review_meeting_attendees_id'), table_name='requirement_review_meeting_attendees')
    op.drop_table('requirement_review_meeting_attendees')

    op.drop_index(op.f('ix_review_meetings_tenant_moderator'), table_name='requirement_review_meetings')
    op.drop_index(op.f('ix_review_meetings_tenant_status'), table_name='requirement_review_meetings')
    op.drop_index(op.f('ix_requirement_review_meetings_tenant_id'), table_name='requirement_review_meetings')
    op.drop_index(op.f('ix_requirement_review_meetings_status'), table_name='requirement_review_meetings')
    op.drop_index(op.f('ix_requirement_review_meetings_scheduled_at'), table_name='requirement_review_meetings')
    op.drop_index(op.f('ix_requirement_review_meetings_meeting_no'), table_name='requirement_review_meetings')
    op.drop_index(op.f('ix_requirement_review_meetings_id'), table_name='requirement_review_meetings')
    op.drop_table('requirement_review_meetings')
