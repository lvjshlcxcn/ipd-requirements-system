"""Add Phase 2 verification tables: feedbacks, verification_metrics, reviews

Revision ID: 004_phase2_verification
Revises: 003_add_new_models_and_fields
Create Date: 2025-01-19

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '003_phase2_verification'
down_revision = '20260118_add_attachments'
branch_labels = None
depends_on = None


def upgrade():
    # ============================================================
    # 1. Create feedbacks table
    # ============================================================
    op.create_table(
        'feedbacks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('feedback_no', sa.String(50), nullable=False),
        sa.Column('feedback_type', sa.String(20), nullable=False),
        sa.Column('source_channel', sa.String(20), nullable=False),
        sa.Column('source_contact', sa.String(100), nullable=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('severity', sa.String(20), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('requirement_id', sa.Integer(), nullable=True),
        sa.Column('ai_suggestion', postgresql.JSONB(), nullable=True),
        sa.Column('conversion_confidence', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['requirement_id'], ['requirements.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id']),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('feedback_no', 'tenant_id', name='feedbacks_unique_no')
    )
    op.create_index('idx_feedbacks_status', 'feedbacks', ['status'])
    op.create_index('idx_feedbacks_type', 'feedbacks', ['feedback_type'])
    op.create_index('idx_feedbacks_requirement', 'feedbacks', ['requirement_id'])

    # ============================================================
    # 2. Create verification_metrics table
    # ============================================================
    op.create_table(
        'verification_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('requirement_id', sa.Integer(), nullable=False),
        sa.Column('metrics_config', postgresql.JSONB(), nullable=False, server_default='[]'),
        sa.Column('actual_metrics', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('verification_status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('verification_notes', sa.Text(), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verified_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id']),
        sa.ForeignKeyConstraint(['requirement_id'], ['requirements.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['verified_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('requirement_id', 'tenant_id', name='verification_metrics_unique_req')
    )
    op.create_index('idx_verification_metrics_req', 'verification_metrics', ['requirement_id'])
    op.create_index('idx_verification_metrics_status', 'verification_metrics', ['verification_status'])

    # ============================================================
    # 3. Create reviews table
    # ============================================================
    op.create_table(
        'reviews',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('requirement_id', sa.Integer(), nullable=False),
        sa.Column('review_no', sa.String(50), nullable=False),
        sa.Column('review_type', sa.String(20), nullable=False),
        sa.Column('review_data', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id']),
        sa.ForeignKeyConstraint(['requirement_id'], ['requirements.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id']),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('review_no', 'tenant_id', name='reviews_unique_no')
    )
    op.create_index('idx_reviews_requirement', 'reviews', ['requirement_id'])
    op.create_index('idx_reviews_status', 'reviews', ['status'])


def downgrade():
    # Drop tables in reverse order
    op.drop_index('idx_reviews_status', table_name='reviews')
    op.drop_index('idx_reviews_requirement', table_name='reviews')
    op.drop_table('reviews')

    op.drop_index('idx_verification_metrics_status', table_name='verification_metrics')
    op.drop_index('idx_verification_metrics_req', table_name='verification_metrics')
    op.drop_table('verification_metrics')

    op.drop_index('idx_feedbacks_requirement', table_name='feedbacks')
    op.drop_index('idx_feedbacks_type', table_name='feedbacks')
    op.drop_index('idx_feedbacks_status', table_name='feedbacks')
    op.drop_table('feedbacks')
