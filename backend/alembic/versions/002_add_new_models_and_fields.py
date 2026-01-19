"""Add new models and fields for Clean Architecture

Revision ID: 002
Revises: 001
Create Date: 2026-01-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create tenants table
    op.create_table(
        'tenants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False, unique=True),
        sa.Column('code', sa.String(length=20), nullable=False, unique=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('settings', sa.String(length=1000), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_tenants_code', 'tenants', ['code'])
    op.create_index('idx_tenants_is_active', 'tenants', ['is_active'])

    # Add tenant_id to users table
    op.add_column('users', sa.Column('tenant_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_users_tenant', 'users', 'tenants', ['tenant_id'], ['id'])
    op.create_index('idx_users_tenant_id', 'users', ['tenant_id'])

    # Update user_role enum with new roles
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'product_manager'")
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'marketing_manager'")
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales_manager'")

    # Add new columns to requirements table
    op.add_column('requirements', sa.Column('tenant_id', sa.Integer(), nullable=True))
    op.add_column('requirements', sa.Column('user_role', sa.String(length=100), nullable=True))
    op.add_column('requirements', sa.Column('user_action', sa.String(length=500), nullable=True))
    op.add_column('requirements', sa.Column('user_benefit', sa.String(length=500), nullable=True))
    op.add_column('requirements', sa.Column('collection_data', postgresql.JSON(), nullable=True))
    op.add_column('requirements', sa.Column('customer_info', postgresql.JSON(), nullable=True))
    op.add_column('requirements', sa.Column('product_info', postgresql.JSON(), nullable=True))
    op.add_column('requirements', sa.Column('user_scenario', postgresql.JSON(), nullable=True))
    op.add_column('requirements', sa.Column('invest_analysis', postgresql.JSON(), nullable=True))
    op.add_column('requirements', sa.Column('moscow_priority', sa.String(length=20), nullable=True, server_default='should_have'))
    op.add_column('requirements', sa.Column('rice_score', postgresql.JSON(), nullable=True))
    op.add_column('requirements', sa.Column('cim_model_reference', sa.String(length=100), nullable=True))
    op.alter_column('requirements', 'priority_score', existing_type=sa.Integer(), type_=sa.Float())

    # Update enum types
    op.execute("ALTER TYPE kano_category ADD VALUE IF NOT EXISTS 'indifferent'")
    op.execute("ALTER TYPE kano_category ADD VALUE IF NOT EXISTS 'reverse'")

    # Create index for tenant_id in requirements
    op.create_index('idx_requirements_tenant_id', 'requirements', ['tenant_id'])
    op.create_foreign_key('fk_requirements_tenant', 'requirements', 'tenants', ['tenant_id'], ['id'])

    # Create requirement_versions table
    op.create_table(
        'requirement_versions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('requirement_id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('data', postgresql.JSON(), nullable=False),
        sa.Column('change_reason', sa.String(length=500), nullable=True),
        sa.Column('changed_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['requirement_id'], ['requirements.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id']),
        sa.ForeignKeyConstraint(['changed_by'], ['users.id'])
    )
    op.create_index('idx_requirement_versions_requirement_id', 'requirement_versions', ['requirement_id'])
    op.create_index('idx_requirement_versions_tenant_id', 'requirement_versions', ['tenant_id'])

    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=True),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'])
    )
    op.create_index('idx_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('idx_notifications_tenant_id', 'notifications', ['tenant_id'])
    op.create_index('idx_notifications_is_read', 'notifications', ['is_read'])
    op.create_index('idx_notifications_created_at', 'notifications', ['created_at'])

    # Create verification_checklists table
    op.create_table(
        'verification_checklists',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('requirement_id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('verification_type', sa.String(length=20), nullable=False),
        sa.Column('checklist_name', sa.String(length=200), nullable=False),
        sa.Column('checklist_items', postgresql.JSON(), nullable=False),
        sa.Column('result', sa.String(length=20), nullable=False, server_default='not_started'),
        sa.Column('evidence_attachments', postgresql.JSON(), nullable=True),
        sa.Column('customer_feedback', sa.Text(), nullable=True),
        sa.Column('issues_found', sa.Text(), nullable=True),
        sa.Column('verified_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['requirement_id'], ['requirements.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id']),
        sa.ForeignKeyConstraint(['verified_by'], ['users.id']),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'])
    )
    op.create_index('idx_verification_checklists_requirement_id', 'verification_checklists', ['requirement_id'])
    op.create_index('idx_verification_checklists_tenant_id', 'verification_checklists', ['tenant_id'])
    op.create_index('idx_verification_checklists_type', 'verification_checklists', ['verification_type'])
    op.create_index('idx_verification_checklists_result', 'verification_checklists', ['result'])

    # Create import_jobs table
    op.create_table(
        'import_jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('imported_by', sa.Integer(), nullable=False),
        sa.Column('import_type', sa.String(length=20), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('total_records', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('success_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('failed_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_log', postgresql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id']),
        sa.ForeignKeyConstraint(['imported_by'], ['users.id'])
    )
    op.create_index('idx_import_jobs_tenant_id', 'import_jobs', ['tenant_id'])
    op.create_index('idx_import_jobs_status', 'import_jobs', ['status'])

    # Create export_jobs table
    op.create_table(
        'export_jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('exported_by', sa.Integer(), nullable=False),
        sa.Column('export_type', sa.String(length=20), nullable=False),
        sa.Column('filters', postgresql.JSON(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='processing'),
        sa.Column('file_path', sa.String(length=500), nullable=True),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('download_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id']),
        sa.ForeignKeyConstraint(['exported_by'], ['users.id'])
    )
    op.create_index('idx_export_jobs_tenant_id', 'export_jobs', ['tenant_id'])
    op.create_index('idx_export_jobs_status', 'export_jobs', ['status'])

    # Create cim_references table
    op.create_table(
        'cim_references',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False, unique=True),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('storage_path', sa.String(length=500), nullable=True),
        sa.Column('version', sa.String(length=20), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'])
    )
    op.create_index('idx_cim_references_type', 'cim_references', ['type'])

    # Create requirement_cim_links table (many-to-many)
    op.create_table(
        'requirement_cim_links',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('requirement_id', sa.Integer(), nullable=False),
        sa.Column('cim_reference_id', sa.Integer(), nullable=False),
        sa.Column('link_type', sa.String(length=20), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['requirement_id'], ['requirements.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['cim_reference_id'], ['cim_references.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('requirement_id', 'cim_reference_id', name='uq_requirement_cim_link')
    )
    op.create_index('idx_requirement_cim_links_requirement_id', 'requirement_cim_links', ['requirement_id'])
    op.create_index('idx_requirement_cim_links_cim_id', 'requirement_cim_links', ['cim_reference_id'])


def downgrade() -> None:
    # Drop requirement_cim_links
    op.drop_index('idx_requirement_cim_links_cim_id', table_name='requirement_cim_links')
    op.drop_index('idx_requirement_cim_links_requirement_id', table_name='requirement_cim_links')
    op.drop_table('requirement_cim_links')

    # Drop cim_references
    op.drop_index('idx_cim_references_type', table_name='cim_references')
    op.drop_table('cim_references')

    # Drop export_jobs
    op.drop_index('idx_export_jobs_status', table_name='export_jobs')
    op.drop_index('idx_export_jobs_tenant_id', table_name='export_jobs')
    op.drop_table('export_jobs')

    # Drop import_jobs
    op.drop_index('idx_import_jobs_status', table_name='import_jobs')
    op.drop_index('idx_import_jobs_tenant_id', table_name='import_jobs')
    op.drop_table('import_jobs')

    # Drop verification_checklists
    op.drop_index('idx_verification_checklists_result', table_name='verification_checklists')
    op.drop_index('idx_verification_checklists_type', table_name='verification_checklists')
    op.drop_index('idx_verification_checklists_tenant_id', table_name='verification_checklists')
    op.drop_index('idx_verification_checklists_requirement_id', table_name='verification_checklists')
    op.drop_table('verification_checklists')

    # Drop notifications
    op.drop_index('idx_notifications_created_at', table_name='notifications')
    op.drop_index('idx_notifications_is_read', table_name='notifications')
    op.drop_index('idx_notifications_tenant_id', table_name='notifications')
    op.drop_index('idx_notifications_user_id', table_name='notifications')
    op.drop_table('notifications')

    # Drop requirement_versions
    op.drop_index('idx_requirement_versions_tenant_id', table_name='requirement_versions')
    op.drop_index('idx_requirement_versions_requirement_id', table_name='requirement_versions')
    op.drop_table('requirement_versions')

    # Remove new columns from requirements
    op.drop_index('idx_requirements_tenant_id', table_name='requirements')
    op.drop_constraint('fk_requirements_tenant', 'requirements', type_='foreignkey')
    op.drop_column('requirements', 'cim_model_reference')
    op.drop_column('requirements', 'rice_score')
    op.drop_column('requirements', 'moscow_priority')
    op.drop_column('requirements', 'invest_analysis')
    op.drop_column('requirements', 'user_scenario')
    op.drop_column('requirements', 'product_info')
    op.drop_column('requirements', 'customer_info')
    op.drop_column('requirements', 'collection_data')
    op.drop_column('requirements', 'user_benefit')
    op.drop_column('requirements', 'user_action')
    op.drop_column('requirements', 'user_role')
    op.drop_column('requirements', 'tenant_id')
    op.alter_column('requirements', 'priority_score', existing_type=sa.Float(), type_=sa.Integer())

    # Remove tenant_id from users
    op.drop_index('idx_users_tenant_id', table_name='users')
    op.drop_constraint('fk_users_tenant', 'users', type_='foreignkey')
    op.drop_column('users', 'tenant_id')

    # Drop tenants table
    op.drop_index('idx_tenants_is_active', table_name='tenants')
    op.drop_index('idx_tenants_code', table_name='tenants')
    op.drop_table('tenants')
