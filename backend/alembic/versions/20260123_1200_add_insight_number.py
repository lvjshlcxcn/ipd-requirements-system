"""add insight number field

Revision ID: 20260123_1200
Revises: 32bdf1b3f76e
Create Date: 2026-01-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260123_1200'
down_revision: Union[str, None] = '32bdf1b3f76e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add insight_number column to insight_analyses table
    op.add_column(
        'insight_analyses',
        sa.Column('insight_number', sa.String(length=50), nullable=True)
    )

    # Generate insight numbers for existing records
    connection = op.get_bind()
    result = connection.execute(
        sa.text("SELECT id FROM insight_analyses ORDER BY id")
    )
    rows = result.fetchall()

    for idx, (row_id,) in enumerate(rows, start=1):
        insight_number = f"Ai-insight-{idx:05d}"
        connection.execute(
            sa.text(
                "UPDATE insight_analyses SET insight_number = :number WHERE id = :id"
            ),
            {"number": insight_number, "id": row_id}
        )

    # Make the column NOT NULL and UNIQUE
    op.alter_column(
        'insight_analyses',
        'insight_number',
        nullable=False
    )
    op.create_unique_constraint(
        'uq_insight_analyses_insight_number',
        'insight_analyses',
        ['insight_number']
    )


def downgrade() -> None:
    # Drop unique constraint
    op.drop_constraint(
        'uq_insight_analyses_insight_number',
        'insight_analyses',
        type_='unique'
    )

    # Drop column
    op.drop_column('insight_analyses', 'insight_number')
