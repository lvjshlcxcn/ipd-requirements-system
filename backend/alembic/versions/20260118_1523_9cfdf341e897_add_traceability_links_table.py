"""add_traceability_links_table

Revision ID: 9cfdf341e897
Revises: 002
Create Date: 2026-01-18 15:23:30.941089

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9cfdf341e897'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create traceability_links table
    op.create_table(
        'traceability_links',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('requirement_id', sa.Integer(), nullable=False),
        sa.Column('design_id', sa.String(length=100), nullable=True),
        sa.Column('code_id', sa.String(length=100), nullable=True),
        sa.Column('test_id', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['requirement_id'], ['requirements.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_traceability_links_id'), 'traceability_links', ['id'])


def downgrade() -> None:
    op.drop_index(op.f('ix_traceability_links_id'), table_name='traceability_links')
    op.drop_table('traceability_links')
