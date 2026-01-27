#!/usr/bin/env python3
"""Initialize default prompt templates in database."""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.prompt_template import PromptTemplate
from app.prompts import IPD_TEN_QUESTIONS_PROMPT, QUICK_INSIGHT_PROMPT
import json


def init_default_templates():
    """Initialize default prompt templates in database."""
    db: Session = SessionLocal()

    try:
        # Check if templates already exist for tenant 1
        existing = db.query(PromptTemplate).filter(
            PromptTemplate.tenant_id == 1,
            PromptTemplate.template_key.in_(['ipd_ten_questions', 'quick_insight'])
        ).first()

        if existing:
            print("✅ Default templates already exist, skipping initialization")
            return

        # Define variables for each template
        ipd_variables = ["text"]
        quick_variables = ["text"]

        # Create IPD Ten Questions template
        ipd_template = PromptTemplate(
            template_key='ipd_ten_questions',
            version='v1.0',
            name='IPD 需求十问模板',
            content=IPD_TEN_QUESTIONS_PROMPT,
            variables=json.dumps(ipd_variables),
            description='IPD需求十问分析模板 - 提取客户需求的核心信息，包括用户角色、问题、期望方案等',
            is_active=True,
            tenant_id=1,  # Default tenant
            created_by=1,  # Admin user (assume ID 1 exists)
            previous_version_id=None
        )

        # Create Quick Insight template
        quick_template = PromptTemplate(
            template_key='quick_insight',
            version='v1.0',
            name='快速分析模板',
            content=QUICK_INSIGHT_PROMPT,
            variables=json.dumps(quick_variables),
            description='快速洞察分析模板 - 仅提取核心信息（用户角色、核心问题、期望方案）',
            is_active=True,
            tenant_id=1,
            created_by=1,
            previous_version_id=None
        )

        db.add(ipd_template)
        db.add(quick_template)
        db.commit()

        print("✅ Default prompt templates initialized successfully")
        print("  - IPD 需求十问模板 (v1.0)")
        print("  - 快速分析模板 (v1.0)")
        print(f"\nTemplate IDs:")
        print(f"  - IPD 十问: {ipd_template.id}")
        print(f"  - 快速分析: {quick_template.id}")

    except Exception as e:
        print(f"❌ Error initializing templates: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == '__main__':
    print("🚀 Initializing default prompt templates...")
    init_default_templates()
    print("✨ Done!")
