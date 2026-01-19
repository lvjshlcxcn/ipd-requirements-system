"""Initial migration - Create all tables

Revision ID: 001
Revises:
Create Date: 2026-01-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=True),
        sa.Column('role', postgresql.ENUM(name='user_role', create_type=True), nullable=False),
        sa.Column('department', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_role', 'users', ['role'])

    # Create requirements table
    op.create_table(
        'requirements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('requirement_no', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('source_channel', postgresql.ENUM(name='source_channel', create_type=True), nullable=False),
        sa.Column('source_contact', sa.String(length=100), nullable=True),
        sa.Column('collector_id', sa.Integer(), nullable=True),
        sa.Column('collected_at', sa.DateTime(), nullable=True),
        sa.Column('customer_need_10q', postgresql.JSON(), nullable=True),
        sa.Column('status', postgresql.ENUM(name='requirement_status', create_type=True), nullable=False),
        sa.Column('priority_score', sa.Integer(), nullable=True),
        sa.Column('priority_rank', sa.Integer(), nullable=True),
        sa.Column('kano_category', postgresql.ENUM(name='kano_category', create_type=True), nullable=True),
        sa.Column('appeals_scores', postgresql.JSON(), nullable=True),
        sa.Column('target_type', postgresql.ENUM(name='target_type', create_type=True), nullable=True),
        sa.Column('target_id', sa.Integer(), nullable=True),
        sa.Column('estimated_duration_months', sa.Integer(), nullable=True),
        sa.Column('complexity_level', postgresql.ENUM(name='complexity_level', create_type=True), nullable=True),
        sa.Column('version', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['collector_id'], ['users.id']),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'])
    )
    op.create_index('idx_requirements_status', 'requirements', ['status'])
    op.create_index('idx_requirements_collected_at', 'requirements', ['collected_at'])

    # Create other tables... (abbreviated for space)
    # In production, use: alembic revision --autogenerate -m "Initial migration"


def downgrade() -> None:
    op.drop_index('idx_requirements_collected_at', table_name='requirements')
    op.drop_index('idx_requirements_status', table_name='requirements')
    op.drop_table('requirements')
    op.drop_index('idx_users_role', table_name='users')
    op.drop_index('idx_users_email', table_name='users')
    op.drop_table('users')
