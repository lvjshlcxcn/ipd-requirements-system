"""add IPD story tables

Revision ID: 20260130_add_ipd_story
Revises:
Create Date: 2026-01-30

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '20260130_add_ipd_story'
down_revision = None  # 设置为你的上一个迁移版本
branch_labels = None
depends_on = None


def upgrade():
    """创建 IPD 需求十问 → 用户故事 → INVEST 分析相关表"""

    # 1. 创建 IPD 十问表
    op.create_table(
        'ipd_ten_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False, comment='租户ID'),
        sa.Column('created_by', sa.Integer(), nullable=False, comment='创建者ID'),
        sa.Column('q1_who', sa.String(length=500), nullable=False, comment='谁关心这个需求'),
        sa.Column('q2_why', sa.String(length=500), nullable=False, comment='为什么关心'),
        sa.Column('q3_what_problem', sa.Text(), nullable=False, comment='什么问题'),
        sa.Column('q4_current_solution', sa.Text(), nullable=True, comment='当前怎么解决的'),
        sa.Column('q5_current_issues', sa.Text(), nullable=True, comment='有什么问题'),
        sa.Column('q6_ideal_solution', sa.Text(), nullable=False, comment='理想方案是什么'),
        sa.Column('q7_priority', sa.String(length=20), nullable=False, comment='优先级'),
        sa.Column('q8_frequency', sa.String(length=20), nullable=False, comment='频次'),
        sa.Column('q9_impact_scope', sa.String(length=500), nullable=True, comment='影响范围'),
        sa.Column('q10_value', sa.String(length=500), nullable=True, comment='价值衡量'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ipd_ten_questions_id'), 'ipd_ten_questions', ['id'])
    op.create_index(op.f('ix_ipd_ten_questions_tenant_id'), 'ipd_ten_questions', ['tenant_id'])

    # 2. 创建用户故事表
    op.create_table(
        'user_stories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False, comment='租户ID'),
        sa.Column('created_by', sa.Integer(), nullable=False, comment='创建者ID'),
        sa.Column('title', sa.String(length=500), nullable=False, comment='故事标题'),
        sa.Column('role', sa.String(length=200), nullable=False, comment='用户角色'),
        sa.Column('action', sa.String(length=500), nullable=False, comment='期望行动'),
        sa.Column('benefit', sa.Text(), nullable=False, comment='预期价值'),
        sa.Column('priority', sa.String(length=20), nullable=False, comment='优先级'),
        sa.Column('frequency', sa.String(length=20), nullable=False, comment='频次'),
        sa.Column('acceptance_criteria', postgresql.JSON(), nullable=False, comment='验收标准列表'),
        sa.Column('ipd_question_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['ipd_question_id'], ['ipd_ten_questions.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_stories_id'), 'user_stories', ['id'])
    op.create_index(op.f('ix_user_stories_tenant_id'), 'user_stories', ['tenant_id'])

    # 3. 创建 INVEST 分析表
    op.create_table(
        'invest_analyses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False, comment='租户ID'),
        sa.Column('created_by', sa.Integer(), nullable=False, comment='创建者ID'),
        sa.Column('story_id', sa.Integer(), nullable=True),
        sa.Column('scores', postgresql.JSON(), nullable=False, comment='INVEST评分'),
        sa.Column('total_score', sa.Integer(), nullable=False, comment='总分'),
        sa.Column('average_score', sa.Float(), nullable=False, comment='平均分'),
        sa.Column('suggestions', postgresql.JSON(), nullable=False, comment='改进建议'),
        sa.Column('notes', sa.Text(), nullable=True, comment='备注'),
        sa.Column('analyzed_at', sa.DateTime(), nullable=False, comment='分析时间'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['story_id'], ['user_stories.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_invest_analyses_id'), 'invest_analyses', ['id'])
    op.create_index(op.f('ix_invest_analyses_tenant_id'), 'invest_analyses', ['tenant_id'])


def downgrade():
    """回滚迁移"""

    # 按依赖关系逆序删除表
    op.drop_index(op.f('ix_invest_analyses_tenant_id'), table_name='invest_analyses')
    op.drop_index(op.f('ix_invest_analyses_id'), table_name='invest_analyses')
    op.drop_table('invest_analyses')

    op.drop_index(op.f('ix_user_stories_tenant_id'), table_name='user_stories')
    op.drop_index(op.f('ix_user_stories_id'), table_name='user_stories')
    op.drop_table('user_stories')

    op.drop_index(op.f('ix_ipd_ten_questions_tenant_id'), table_name='ipd_ten_questions')
    op.drop_index(op.f('ix_ipd_ten_questions_id'), table_name='ipd_ten_questions')
    op.drop_table('ipd_ten_questions')
