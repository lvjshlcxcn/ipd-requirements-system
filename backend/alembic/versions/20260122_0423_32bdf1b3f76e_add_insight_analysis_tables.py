"""add insight analysis tables

Revision ID: 32bdf1b3f76e
Revises: 003_phase2_verification
Create Date: 2026-01-22 04:23:53.349443

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '32bdf1b3f76e'
down_revision: Union[str, None] = '003_phase2_verification'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create insight_analyses table
    op.create_table(
        'insight_analyses',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('input_text', sa.Text(), nullable=False),
        sa.Column('text_length', sa.Integer(), nullable=False),
        sa.Column('input_source', sa.String(length=50), nullable=False),
        sa.Column('llm_provider', sa.String(length=50), nullable=False, server_default='deepseek'),
        sa.Column('llm_model', sa.String(length=100), nullable=False, server_default='deepseek-chat'),
        sa.Column('analysis_mode', sa.String(length=50), nullable=False, server_default='full'),
        sa.Column('prompt_version', sa.String(length=20), nullable=True, server_default='v1.0'),
        sa.Column('analysis_result', postgresql.JSONB(), nullable=False),
        sa.Column('q1_who', sa.Text(), nullable=True),
        sa.Column('q2_why', sa.Text(), nullable=True),
        sa.Column('q3_what_problem', sa.Text(), nullable=True),
        sa.Column('q4_current_solution', sa.Text(), nullable=True),
        sa.Column('q5_current_issues', sa.Text(), nullable=True),
        sa.Column('q6_ideal_solution', sa.Text(), nullable=True),
        sa.Column('q7_priority', sa.String(length=20), nullable=True),
        sa.Column('q8_frequency', sa.String(length=20), nullable=True),
        sa.Column('q9_impact_scope', sa.Text(), nullable=True),
        sa.Column('q10_value', sa.Text(), nullable=True),
        sa.Column('user_persona', postgresql.JSONB(), nullable=True),
        sa.Column('scenario', postgresql.JSONB(), nullable=True),
        sa.Column('emotional_tags', postgresql.JSONB(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('analysis_duration', sa.Integer(), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_insight_analyses_id', 'insight_analyses', ['id'])
    op.create_index('ix_insight_analyses_tenant_id', 'insight_analyses', ['tenant_id'])

    # Create user_storyboards table
    op.create_table(
        'user_storyboards',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('insight_id', sa.BigInteger(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('card_data', postgresql.JSONB(), nullable=False),
        sa.Column('card_style', sa.String(length=50), nullable=True, server_default='modern'),
        sa.Column('color_theme', sa.String(length=50), nullable=True),
        sa.Column('export_image_path', sa.Text(), nullable=True),
        sa.Column('export_pdf_path', sa.Text(), nullable=True),
        sa.Column('linked_requirement_id', sa.Integer(), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['insight_id'], ['insight_analyses.id'], ),
        sa.ForeignKeyConstraint(['linked_requirement_id'], ['requirements.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_user_storyboards_id', 'user_storyboards', ['id'])
    op.create_index('ix_user_storyboards_tenant_id', 'user_storyboards', ['tenant_id'])


def downgrade() -> None:
    # Drop user_storyboards table
    op.drop_index('ix_user_storyboards_tenant_id', table_name='user_storyboards')
    op.drop_index('ix_user_storyboards_id', table_name='user_storyboards')
    op.drop_table('user_storyboards')

    # Drop insight_analyses table
    op.drop_index('ix_insight_analyses_tenant_id', table_name='insight_analyses')
    op.drop_index('ix_insight_analyses_id', table_name='insight_analyses')
    op.drop_table('insight_analyses')
