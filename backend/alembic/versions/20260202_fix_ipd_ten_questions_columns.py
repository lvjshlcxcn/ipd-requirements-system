"""fix IPD ten questions column names

Revision ID: 20260202_fix_ipd_columns
Revises:
Create Date: 2026-02-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '20260202_fix_ipd_columns'
down_revision = '62c050d1ab82'
branch_labels = None
depends_on = None


def upgrade():
    """修复 IPD 十问表字段名称"""

    # 方案 1: 添加新列（更安全，保留旧数据）
    # 添加 q9_expected_value 列
    op.add_column('ipd_ten_questions', sa.Column('q9_expected_value', sa.Text(), nullable=True, comment='预期价值'))

    # 添加 q10_success_metrics 列
    op.add_column('ipd_ten_questions', sa.Column('q10_success_metrics', sa.Text(), nullable=True, comment='成功指标'))

    # 数据迁移：如果需要，可以从旧列复制数据到新列
    # op.execute("UPDATE ipd_ten_questions SET q9_expected_value = q9_impact_scope")
    # op.execute("UPDATE ipd_ten_questions SET q10_success_metrics = q10_value")

    # 注意：保留旧列以避免破坏现有数据
    # 后续可以通过另一个 migration 删除旧列


def downgrade():
    """回滚迁移"""

    # 删除新增的列
    op.drop_column('ipd_ten_questions', 'q10_success_metrics')
    op.drop_column('ipd_ten_questions', 'q9_expected_value')
