"""Add attachments table for file uploads

Revision ID: 20260118_add_attachments
Revises: 002
Create Date: 2026-01-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260118_add_attachments'
down_revision: Union[str, None] = '9cfdf341e897'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create attachments table
    op.create_table(
        'attachments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('entity_type', sa.String(length=30), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('file_type', sa.String(length=50), nullable=True),
        sa.Column('mime_type', sa.String(length=100), nullable=True),
        sa.Column('uploaded_by', sa.Integer(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_attachments_id', 'attachments', ['id'])
    op.create_index('ix_attachments_entity_type_id', 'attachments', ['entity_type', 'entity_id'])
    op.create_foreign_key('fk_attachments_uploaded_by', 'attachments', 'users', ['uploaded_by'], ['id'])


def downgrade() -> None:
    # Drop attachments table
    op.drop_constraint('fk_attachments_uploaded_by', 'attachments', type_='foreignkey')
    op.drop_index('ix_attachments_entity_type_id', table_name='attachments')
    op.drop_index('ix_attachments_id', table_name='attachments')
    op.drop_table('attachments')
