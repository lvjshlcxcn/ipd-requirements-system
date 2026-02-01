"""Migrate INVEST analysis from boolean to scoring system

Revision ID: 20260128_migrate_invest_to_scoring
Revises: 20260125_add_prompt_templates
Create Date: 2026-01-28

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260128_invest_score'
down_revision = '20260125_add_prompt_templates'
branch_labels = None
depends_on = None


def upgrade():
    """Migrate INVEST analysis data from boolean (true/false) to scoring system (0-100).

    Migration rules:
    - true (passed) -> 85 points
    - false (not passed) -> 40 points
    - null/missing -> 50 points
    """
    connection = op.get_bind()

    # 将布尔值转换为评分
    # 注意：由于 JSONB 数据可能已存在，我们使用 SQL 批量更新
    migration_sql = """
    UPDATE requirements
    SET invest_analysis = jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            invest_analysis,
                            '{independent}',
                            CASE
                                WHEN (invest_analysis->>'independent')::boolean IS TRUE THEN '85'
                                WHEN (invest_analysis->>'independent')::boolean IS FALSE THEN '40'
                                ELSE '50'
                            END::jsonb
                        ),
                        '{negotiable}',
                        CASE
                            WHEN (invest_analysis->>'negotiable')::boolean IS TRUE THEN '85'
                            WHEN (invest_analysis->>'negotiable')::boolean IS FALSE THEN '40'
                            ELSE '50'
                        END::jsonb
                    ),
                    '{valuable}',
                    CASE
                        WHEN (invest_analysis->>'valuable')::boolean IS TRUE THEN '85'
                        WHEN (invest_analysis->>'valuable')::boolean IS FALSE THEN '40'
                        ELSE '50'
                    END::jsonb
                ),
                '{estimable}',
                CASE
                    WHEN (invest_analysis->>'estimable')::boolean IS TRUE THEN '85'
                    WHEN (invest_analysis->>'estimable')::boolean IS FALSE THEN '40'
                    ELSE '50'
                END::jsonb
            ),
            '{small}',
            CASE
                WHEN (invest_analysis->>'small')::boolean IS TRUE THEN '85'
                WHEN (invest_analysis->>'small')::boolean IS FALSE THEN '40'
                ELSE '50'
            END::jsonb
        ),
        '{testable}',
        CASE
            WHEN (invest_analysis->>'testable')::boolean IS TRUE THEN '85'
            WHEN (invest_analysis->>'testable')::boolean IS FALSE THEN '40'
            ELSE '50'
        END::jsonb
    )
    WHERE invest_analysis IS NOT NULL
      AND jsonb_typeof(invest_analysis->'independent') = 'boolean'
    """

    # 执行布尔值到评分的转换
    connection.execute(sa.text(migration_sql))

    # 计算并添加 total_score 和 average_score
    calculate_scores_sql = """
    UPDATE requirements
    SET invest_analysis = invest_analysis || jsonb_build_object(
        'total_score',
        (invest_analysis->>'independent')::int +
        (invest_analysis->>'negotiable')::int +
        (invest_analysis->>'valuable')::int +
        (invest_analysis->>'estimable')::int +
        (invest_analysis->>'small')::int +
        (invest_analysis->>'testable')::int,
        'average_score',
        round(
            (
                (invest_analysis->>'independent')::int +
                (invest_analysis->>'negotiable')::int +
                (invest_analysis->>'valuable')::int +
                (invest_analysis->>'estimable')::int +
                (invest_analysis->>'small')::int +
                (invest_analysis->>'testable')::int
            )::numeric / 6,
            2
        ),
        '_migrated', true
    )
    WHERE invest_analysis IS NOT NULL
      AND jsonb_typeof(invest_analysis->'independent') = 'number'
    """

    connection.execute(sa.text(calculate_scores_sql))


def downgrade():
    """Revert INVEST analysis from scoring back to boolean system.

    Reversion rules:
    - score >= 70 -> true
    - score < 70 -> false
    """
    connection = op.get_bind()

    # 将评分转回布尔值
    revert_sql = """
    UPDATE requirements
    SET invest_analysis = jsonb_set(
        jsonb_set(
            jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            invest_analysis - 'total_score' - 'average_score' - '_migrated',
                            '{independent}',
                            CASE WHEN (invest_analysis->>'independent')::int >= 70 THEN 'true' ELSE 'false' END::jsonb
                        ),
                        '{negotiable}',
                        CASE WHEN (invest_analysis->>'negotiable')::int >= 70 THEN 'true' ELSE 'false' END::jsonb
                    ),
                    '{valuable}',
                    CASE WHEN (invest_analysis->>'valuable')::int >= 70 THEN 'true' ELSE 'false' END::jsonb
                ),
                '{estimable}',
                CASE WHEN (invest_analysis->>'estimable')::int >= 70 THEN 'true' ELSE 'false' END::jsonb
            ),
            '{small}',
            CASE WHEN (invest_analysis->>'small')::int >= 70 THEN 'true' ELSE 'false' END::jsonb
        ),
        '{testable}',
        CASE WHEN (invest_analysis->>'testable')::int >= 70 THEN 'true' ELSE 'false' END::jsonb
    )
    WHERE invest_analysis IS NOT NULL
      AND jsonb_typeof(invest_analysis->>'total_score') = 'number'
    """

    connection.execute(sa.text(revert_sql))
