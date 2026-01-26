"""add prompt templates table

Revision ID: 20260125_add_prompt_templates
Revises: 20260123_2000_add_cascade_delete
Create Date: 2026-01-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260125_add_prompt_templates'
down_revision = '20260123_2000_add_cascade_delete'
branch_labels = None
depends_on = None


def upgrade():
    """Create prompt_templates table."""
    op.create_table(
        'prompt_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_key', sa.String(length=50), nullable=False),
        sa.Column('version', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('variables', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('previous_version_id', sa.Integer(), nullable=True),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['previous_version_id'], ['prompt_templates.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_prompt_templates_tenant_id', 'prompt_templates', ['tenant_id'], unique=False)
    op.create_index('ix_prompt_templates_template_key', 'prompt_templates', ['template_key'], unique=False)


def downgrade():
    """Drop prompt_templates table."""
    op.drop_index('ix_prompt_templates_template_key', table_name='prompt_templates')
    op.drop_index('ix_prompt_templates_tenant_id', table_name='prompt_templates')
    op.drop_table('prompt_templates')
