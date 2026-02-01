"""add RTM attachment fields

Revision ID: 20260131_add_rtm_attachments
Revises: 20260130_add_ipd_story
Create Date: 2026-01-31

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '20260131_add_rtm_attachments'
down_revision = '20260130_add_ipd_story'
branch_labels = None
depends_on = None


def upgrade():
    """为 traceability_links 表添加附件关联字段"""

    # 添加附件ID字段
    op.add_column(
        'traceability_links',
        sa.Column('design_attachment_id', sa.Integer(), nullable=True)
    )
    op.add_column(
        'traceability_links',
        sa.Column('code_attachment_id', sa.Integer(), nullable=True)
    )
    op.add_column(
        'traceability_links',
        sa.Column('test_attachment_id', sa.Integer(), nullable=True)
    )

    # 创建外键约束
    op.create_foreign_key(
        'fk_traceability_links_design_attachment',
        'traceability_links', 'attachments',
        ['design_attachment_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_traceability_links_code_attachment',
        'traceability_links', 'attachments',
        ['code_attachment_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_traceability_links_test_attachment',
        'traceability_links', 'attachments',
        ['test_attachment_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade():
    """回滚迁移"""

    # 删除外键约束
    op.drop_constraint('fk_traceability_links_test_attachment', 'traceability_links', type_='foreignkey')
    op.drop_constraint('fk_traceability_links_code_attachment', 'traceability_links', type_='foreignkey')
    op.drop_constraint('fk_traceability_links_design_attachment', 'traceability_links', type_='foreignkey')

    # 删除字段
    op.drop_column('traceability_links', 'test_attachment_id')
    op.drop_column('traceability_links', 'code_attachment_id')
    op.drop_column('traceability_links', 'design_attachment_id')
