# IPD 需求管理系统 - 数据库表关系报告

## 项目概述

**项目名称**: IPD (集成产品开发) 需求管理系统
**数据库**: PostgreSQL 15
**ORM**: SQLAlchemy 2.0 (异步)
**架构**: 多租户 SaaS 架构

---

## 数据库表总览

系统共包含 **23 张核心数据表**，按功能模块分类如下：

| 分类 | 表数量 | 表名 |
|------|--------|------|
| 核心基础 | 2 | tenants, users |
| 需求管理 | 3 | requirements, requirement_10q_answers, requirement_versions |
| 分析模型 | 2 | appeals_analysis, kano_classification |
| 分发管理 | 4 | strategic_plans, business_plans, charters, pcr_requests |
| 追溯矩阵 | 1 | traceability_links |
| 验证管理 | 3 | verification_records, verification_checklists, verification_metrics |
| CIM 模型 | 2 | cim_references, requirement_cim_links |
| 工作流 | 1 | workflow_history |
| 反馈审核 | 2 | feedbacks, reviews |
| 附件管理 | 1 | attachments |
| 通知管理 | 1 | notifications |
| 数据导入导出 | 2 | import_jobs, export_jobs |

---

## 核心表详解

### 1. 核心基础表

#### 1.1 tenants (租户表)
```sql
CREATE TABLE tenants (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) UNIQUE NOT NULL,
    code            VARCHAR(20) UNIQUE NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    settings        VARCHAR(1000),          -- JSON 格式配置
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

**作用**: 多租户隔离，每个租户代表一个客户或组织

---

#### 1.2 users (用户表)
```sql
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100),
    role            ENUM(admin, product_manager, marketing_manager,
                         sales_manager, pm, engineer, stakeholder),
    department      VARCHAR(50),
    is_active       BOOLEAN DEFAULT TRUE,
    tenant_id       INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

**外键关系**:
- `tenant_id` → `tenants.id` (多对一)

---

### 2. 需求管理表

#### 2.1 requirements (需求主表)
```sql
CREATE TABLE requirements (
    id                          SERIAL PRIMARY KEY,
    requirement_no              VARCHAR(50) UNIQUE NOT NULL,
    title                       VARCHAR(200) NOT NULL,
    description                 TEXT NOT NULL,

    -- 用户故事格式
    user_story_role             VARCHAR(100),
    user_story_action           TEXT,
    user_story_benefit          TEXT,

    -- 收集信息
    source_channel              ENUM(customer, market, competition,
                                   sales, after_sales, rd),
    source_contact              VARCHAR(100),
    collector_id                INTEGER REFERENCES users(id),

    -- 客户需求十问 (JSONB)
    customer_need_10q           JSONB,
    customer_info               JSONB,
    product_info                JSONB,
    user_scenario               TEXT,
    cim_model_reference         VARCHAR(100),

    -- 状态和优先级
    status                      ENUM(collected, analyzing, analyzed,
                                   distributing, distributed, implementing,
                                   verifying, completed, rejected),
    priority_score              FLOAT,
    priority_rank               INTEGER,

    -- 分析结果
    kano_category               ENUM(basic, performance, excitement),
    appeals_scores              JSONB,
    invest_analysis             JSONB,
    moscow_priority             VARCHAR(20),
    rice_score                  JSONB,

    -- 分发信息
    target_type                 ENUM(sp, bp, charter, pcr),
    target_id                   INTEGER,

    -- 时间估算
    estimated_duration_months   FLOAT,
    complexity_level            ENUM(low, medium, high, very_high),

    -- 元数据
    version                     INTEGER DEFAULT 1,
    created_by                  INTEGER REFERENCES users(id),
    updated_by                  INTEGER REFERENCES users(id),
    tenant_id                   INTEGER NOT NULL,
    created_at                  TIMESTAMP DEFAULT NOW(),
    updated_at                  TIMESTAMP DEFAULT NOW()
);
```

**外键关系**:
- `collector_id` → `users.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`
- 通过 `tenant_id` 隔离

**核心关系**: 这是整个系统的核心表，几乎所有其他表都与之关联

---

#### 2.2 requirement_10q_answers (需求十问详细答案表)
```sql
CREATE TABLE requirement_10q_answers (
    id              SERIAL PRIMARY KEY,
    requirement_id  INTEGER REFERENCES requirements(id) ON DELETE CASCADE UNIQUE,

    q1_who_cares           TEXT,
    q2_why_care            TEXT,
    q3_how_often           TEXT,
    q4_current_solution    TEXT,
    q5_pain_points         TEXT,
    q6_expected_outcome    TEXT,
    q7_value_impact        TEXT,
    q8_urgency_level       TEXT,
    q9_expected_value      TEXT,
    q10_success_metrics    TEXT,

    additional_notes  TEXT,
    answered_by       INTEGER REFERENCES users(id),
    tenant_id         INTEGER NOT NULL,
    created_at        TIMESTAMP DEFAULT NOW(),
    updated_at        TIMESTAMP DEFAULT NOW()
);
```

**外键关系**:
- `requirement_id` → `requirements.id` (一对一，ON DELETE CASCADE)
- `answered_by` → `users.id`

---

#### 2.3 requirement_versions (需求版本历史表)
```sql
CREATE TABLE requirement_versions (
    id              SERIAL PRIMARY KEY,
    requirement_id  INTEGER REFERENCES requirements(id) ON DELETE CASCADE,
    version_number  INTEGER NOT NULL,
    data            JSONB NOT NULL,        -- 版本快照
    change_reason   TEXT,
    changed_by      INTEGER REFERENCES users(id),
    tenant_id       INTEGER NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

**外键关系**:
- `requirement_id` → `requirements.id` (一对多)
- `changed_by` → `users.id`

---

### 3. 分析模型表

#### 3.1 appeals_analysis (APPEALS 八维度分析表)
```sql
CREATE TABLE appeals_analysis (
    id              SERIAL PRIMARY KEY,
    requirement_id  INTEGER REFERENCES requirements(id) ON DELETE CASCADE UNIQUE,

    -- 8 个维度评分
    price_score              INTEGER,
    price_weight             DECIMAL(3,2),
    price_comment            TEXT,

    availability_score       INTEGER,
    availability_weight      DECIMAL(3,2),
    availability_comment     TEXT,

    packaging_score          INTEGER,
    packaging_weight         DECIMAL(3,2),
    packaging_comment        TEXT,

    performance_score        INTEGER,
    performance_weight       DECIMAL(3,2),
    performance_comment      TEXT,

    ease_of_use_score        INTEGER,
    ease_of_use_weight       DECIMAL(3,2),
    ease_of_use_comment      TEXT,

    assurance_score          INTEGER,
    assurance_weight         DECIMAL(3,2),
    assurance_comment        TEXT,

    lifecycle_cost_score     INTEGER,
    lifecycle_cost_weight    DECIMAL(3,2),
    lifecycle_cost_comment   TEXT,

    social_acceptance_score  INTEGER,
    social_acceptance_weight DECIMAL(3,2),
    social_acceptance_comment TEXT,

    total_weighted_score     DECIMAL(10,2),

    analyzed_at      TIMESTAMP DEFAULT NOW(),
    analyzed_by      INTEGER REFERENCES users(id)
);
```

**外键关系**:
- `requirement_id` → `requirements.id` (一对一)
- `analyzed_by` → `users.id`

---

#### 3.2 kano_classification (KANO 分类表)
```sql
CREATE TABLE kano_classification (
    id              SERIAL PRIMARY KEY,
    requirement_id  INTEGER REFERENCES requirements(id) ON DELETE CASCADE UNIQUE,

    category            VARCHAR(20) NOT NULL,  -- basic, performance, excitement
    confidence_level    DECIMAL(4,2),

    -- 调查结果
    functional_present  INTEGER,
    functional_absent   INTEGER,
    dysfunctional_present INTEGER,
    dysfunctional_absent INTEGER,

    classification_reason TEXT,
    better_answer        TEXT,
    worse_answer         TEXT,

    classified_at TIMESTAMP DEFAULT NOW(),
    classified_by INTEGER REFERENCES users(id)
);
```

**外键关系**:
- `requirement_id` → `requirements.id` (一对一)
- `classified_by` → `users.id`

---

### 4. 分发管理表 (SP/BP/Charter/PCR)

#### 4.1 strategic_plans (战略规划表 - SP)
```sql
CREATE TABLE strategic_plans (
    id              SERIAL PRIMARY KEY,
    sp_code         VARCHAR(50) UNIQUE NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,

    year            INTEGER NOT NULL,
    status          ENUM(draft, approved, in_execution, completed),

    strategic_importance VARCHAR(20),
    investment_budget   DECIMAL(15,2),

    start_date      DATE,
    end_date        DATE,

    created_at      TIMESTAMP DEFAULT NOW(),
    created_by      INTEGER REFERENCES users(id),
    updated_at      TIMESTAMP DEFAULT NOW(),
    updated_by      INTEGER REFERENCES users(id)
);
```

**外键关系**:
- `created_by` → `users.id`
- `updated_by` → `users.id`

---

#### 4.2 business_plans (业务计划表 - BP)
```sql
CREATE TABLE business_plans (
    id              SERIAL PRIMARY KEY,
    bp_code         VARCHAR(50) UNIQUE NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,

    sp_id           INTEGER REFERENCES strategic_plans(id),
    quarter         VARCHAR(10) NOT NULL,  -- 2026-Q1
    year            INTEGER NOT NULL,
    status          ENUM(draft, approved, in_execution, completed),

    budget              DECIMAL(15,2),
    expected_revenue    DECIMAL(15,2),

    start_date      DATE,
    end_date        DATE,

    created_at      TIMESTAMP DEFAULT NOW(),
    created_by      INTEGER REFERENCES users(id),
    updated_at      TIMESTAMP DEFAULT NOW(),
    updated_by      INTEGER REFERENCES users(id)
);
```

**外键关系**:
- `sp_id` → `strategic_plans.id` (多对一)
- `created_by` → `users.id`
- `updated_by` → `users.id`

**层级关系**: SP (长期) → BP (中期)

---

#### 4.3 charters (项目任务书表 - Charter)
```sql
CREATE TABLE charters (
    id              SERIAL PRIMARY KEY,
    charter_code    VARCHAR(50) UNIQUE NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,

    bp_id           INTEGER REFERENCES business_plans(id),
    project_type    VARCHAR(50),  -- new_product, enhancement, maintenance

    objectives      TEXT,
    scope           TEXT,
    assumptions      TEXT,
    constraints     TEXT,

    project_manager_id INTEGER REFERENCES users(id),
    team_lead_id       INTEGER REFERENCES users(id),
    team_size          INTEGER,

    estimated_duration_months INTEGER,
    budget              DECIMAL(15,2),

    status          ENUM(draft, approved, in_planning, in_development,
                        in_testing, completed, cancelled),

    start_date      DATE,
    end_date        DATE,

    created_at      TIMESTAMP DEFAULT NOW(),
    created_by      INTEGER REFERENCES users(id),
    updated_at      TIMESTAMP DEFAULT NOW(),
    updated_by      INTEGER REFERENCES users(id)
);
```

**外键关系**:
- `bp_id` → `business_plans.id` (多对一)
- `project_manager_id` → `users.id`
- `team_lead_id` → `users.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`

**层级关系**: SP → BP → Charter (短期)

---

#### 4.4 pcr_requests (产品变更请求表 - PCR)
```sql
CREATE TABLE pcr_requests (
    id              SERIAL PRIMARY KEY,
    pcr_code        VARCHAR(50) UNIQUE NOT NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,

    requirement_id  INTEGER REFERENCES requirements(id),
    charter_id      INTEGER REFERENCES charters(id),

    change_type     ENUM(addition, modification, removal),
    urgency_level   ENUM(critical, high, medium, low),

    -- 影响分析
    impact_assessment   TEXT,
    risk_assessment     TEXT,
    estimated_effort_hours INTEGER,

    -- 审批流程
    status          ENUM(submitted, under_review, approved,
                        rejected, implemented, closed),
    submitted_by    INTEGER REFERENCES users(id),
    reviewed_by     INTEGER REFERENCES users(id),
    approved_by     INTEGER REFERENCES users(id),

    submitted_at    TIMESTAMP DEFAULT NOW(),
    reviewed_at     TIMESTAMP,
    approved_at     TIMESTAMP,
    implemented_at  TIMESTAMP
);
```

**外键关系**:
- `requirement_id` → `requirements.id` (多对一)
- `charter_id` → `charters.id` (多对一)
- `submitted_by` → `users.id`
- `reviewed_by` → `users.id`
- `approved_by` → `users.id`

---

### 5. 需求追溯矩阵表

#### 5.1 traceability_links (需求追溯关联表)
```sql
CREATE TABLE traceability_links (
    id              SERIAL PRIMARY KEY,
    requirement_id  INTEGER REFERENCES requirements(id) ON DELETE CASCADE,

    -- 文档 ID
    design_id       VARCHAR(100),
    code_id         VARCHAR(100),
    test_id         VARCHAR(100),

    -- 附件关联
    design_attachment_id   INTEGER REFERENCES attachments(id) ON DELETE SET NULL,
    code_attachment_id     INTEGER REFERENCES attachments(id) ON DELETE SET NULL,
    test_attachment_id     INTEGER REFERENCES attachments(id) ON DELETE SET NULL,

    status          VARCHAR(50) DEFAULT 'active',
    notes           TEXT,
    tenant_id       INTEGER REFERENCES tenants(id),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

**外键关系**:
- `requirement_id` → `requirements.id` (一对多)
- `design_attachment_id` → `attachments.id`
- `code_attachment_id` → `attachments.id`
- `test_attachment_id` → `attachments.id`
- `tenant_id` → `tenants.id`

---

### 6. 验证管理表

#### 6.1 verification_records (验证记录表)
```sql
CREATE TABLE verification_records (
    id              SERIAL PRIMARY KEY,
    requirement_id  INTEGER REFERENCES requirements(id) ON DELETE CASCADE,

    verification_type    ENUM(prototype, test, user_trial, customer_confirmation),
    verification_method  TEXT,

    result              ENUM(passed, failed, partial_passed, pending),
    evidence_attachments JSONB,

    -- 客户反馈
    customer_feedback   TEXT,
    satisfaction_score  INTEGER,

    -- 问题记录
    issues_found           TEXT,
    improvement_suggestions TEXT,

    verified_at      TIMESTAMP DEFAULT NOW(),
    verified_by      INTEGER REFERENCES users(id),

    reviewed_by      INTEGER REFERENCES users(id),
    reviewed_at      TIMESTAMP
);
```

**外键关系**:
- `requirement_id` → `requirements.id` (一对多)
- `verified_by` → `users.id`
- `reviewed_by` → `users.id`

---

#### 6.2 verification_checklists (验证检查清单表)
```sql
CREATE TABLE verification_checklists (
    id              SERIAL PRIMARY KEY,
    requirement_id  INTEGER REFERENCES requirements(id) ON DELETE CASCADE,

    verification_type    ENUM(fat, sat, uat, prototype, test),
    checklist_name       VARCHAR(100) NOT NULL,

    checklist_items      JSONB NOT NULL,  -- 检查项数组

    result               ENUM(not_started, in_progress, passed,
                              failed, partial_passed, blocked),

    evidence_attachments JSONB,
    customer_feedback    TEXT,
    issues_found         TEXT,

    verified_by      INTEGER REFERENCES users(id),
    reviewed_by      INTEGER REFERENCES users(id),

    tenant_id        INTEGER NOT NULL,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);
```

**外键关系**:
- `requirement_id` → `requirements.id` (一对多)
- `verified_by` → `users.id`
- `reviewed_by` → `users.id`

---

#### 6.3 verification_metrics (验证指标表)
```sql
CREATE TABLE verification_metrics (
    id              SERIAL PRIMARY KEY,
    requirement_id  INTEGER REFERENCES requirements(id) ON DELETE CASCADE,

    metrics_config  JSONB NOT NULL DEFAULT [],   -- 指标配置
    actual_metrics  JSONB NOT NULL DEFAULT {},   -- 实际指标数据

    verification_status   VARCHAR(20) DEFAULT 'pending',
    verification_notes    TEXT,
    verified_at           TIMESTAMP,
    verified_by           INTEGER REFERENCES users(id),

    tenant_id       INTEGER NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

**外键关系**:
- `requirement_id` → `requirements.id` (一对多)
- `verified_by` → `users.id`

---

### 7. CIM 模型表

#### 7.1 cim_references (CIM 模型参考表)
```sql
CREATE TABLE cim_references (
    id              SERIAL PRIMARY KEY,
    reference_code  VARCHAR(50) UNIQUE NOT NULL,
    model_name      VARCHAR(200) NOT NULL,
    model_type      ENUM(process, data, functional, non_functional),
    description     TEXT,
    storage_path    VARCHAR(500),
    version         VARCHAR(20),

    created_by      INTEGER REFERENCES users(id),
    tenant_id       INTEGER NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

**外键关系**:
- `created_by` → `users.id`

---

#### 7.2 requirement_cim_links (需求-CIM 关联表)
```sql
CREATE TABLE requirement_cim_links (
    id              SERIAL PRIMARY KEY,
    requirement_id  INTEGER REFERENCES requirements(id) ON DELETE CASCADE,
    cim_reference_id INTEGER REFERENCES cim_references(id) ON DELETE CASCADE,

    link_type       ENUM(implements, extends, refines, references),

    created_by      INTEGER REFERENCES users(id),
    tenant_id       INTEGER NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

**外键关系**:
- `requirement_id` → `requirements.id` (多对多)
- `cim_reference_id` → `cim_references.id` (多对多)
- `created_by` → `users.id`

---

### 8. 其他功能表

#### 8.1 workflow_history (工作流历史表)
```sql
CREATE TABLE workflow_history (
    id              SERIAL PRIMARY KEY,
    entity_type     VARCHAR(30) NOT NULL,
    entity_id       INTEGER NOT NULL,

    action          VARCHAR(50) NOT NULL,
    from_status     VARCHAR(30),
    to_status       VARCHAR(30) NOT NULL,

    action_reason   TEXT,
    comments        TEXT,
    changes_snapshot JSON,

    performed_by    INTEGER REFERENCES users(id),
    performed_at    TIMESTAMP DEFAULT NOW()
);
```

**外键关系**:
- `performed_by` → `users.id`

**作用**: 记录所有实体的状态变更历史

---

#### 8.2 feedbacks (反馈表)
```sql
CREATE TABLE feedbacks (
    id              SERIAL PRIMARY KEY,
    feedback_no     VARCHAR(50) UNIQUE NOT NULL,

    feedback_type   VARCHAR(20) NOT NULL,  -- bug, feature_request, improvement, complaint
    source_channel  VARCHAR(20) NOT NULL,  -- customer, support, sales, market, rd
    source_contact  VARCHAR(100),

    title           VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    severity        VARCHAR(20),  -- critical, high, medium, low

    status          VARCHAR(20) DEFAULT 'pending',  -- pending, analyzing, converted, rejected, closed

    requirement_id  INTEGER REFERENCES requirements(id) ON DELETE SET NULL,

    ai_suggestion       JSONB,
    conversion_confidence FLOAT,

    created_by      INTEGER REFERENCES users(id),
    updated_by      INTEGER REFERENCES users(id),
    tenant_id       INTEGER NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

**外键关系**:
- `requirement_id` → `requirements.id` (多对一)
- `created_by` → `users.id`
- `updated_by` → `users.id`

---

#### 8.3 reviews (审核/复盘表)
```sql
CREATE TABLE reviews (
    id              SERIAL PRIMARY KEY,
    requirement_id  INTEGER REFERENCES requirements(id) ON DELETE CASCADE,

    review_no       VARCHAR(50) UNIQUE NOT NULL,
    review_type     VARCHAR(20) NOT NULL,  -- completion, monthly, quarterly, manual

    review_data     JSONB NOT NULL DEFAULT {},  -- 审核内容
    status          VARCHAR(20) DEFAULT 'draft',

    reviewed_at     TIMESTAMP,
    reviewed_by     INTEGER REFERENCES users(id),

    created_by      INTEGER REFERENCES users(id),
    tenant_id       INTEGER NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

**外键关系**:
- `requirement_id` → `requirements.id` (一对多)
- `reviewed_by` → `users.id`
- `created_by` → `users.id`

---

#### 8.4 attachments (附件表)
```sql
CREATE TABLE attachments (
    id              SERIAL PRIMARY KEY,
    entity_type     VARCHAR(30) NOT NULL,
    entity_id       INTEGER NOT NULL,

    file_name       VARCHAR(255) NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    file_size       BIGINT,
    file_type       VARCHAR(50),
    mime_type       VARCHAR(100),

    uploaded_by     INTEGER REFERENCES users(id),
    uploaded_at     TIMESTAMP DEFAULT NOW(),

    description     TEXT,
    is_deleted      BOOLEAN DEFAULT FALSE
);
```

**外键关系**:
- `uploaded_by` → `users.id`

**作用**: 通用附件管理，通过 `entity_type` 和 `entity_id` 关联到任意实体

---

#### 8.5 notifications (通知表)
```sql
CREATE TABLE notifications (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,

    notification_type ENUM(requirement_created, requirement_updated,
                          requirement_assigned, requirement_status_changed,
                          analysis_completed, verification_completed,
                          comment_added, mention),

    title           VARCHAR(200) NOT NULL,
    message         VARCHAR(1000) NOT NULL,

    entity_type     VARCHAR(50),
    entity_id       INTEGER,

    is_read         BOOLEAN DEFAULT FALSE,
    read_at         TIMESTAMP,

    tenant_id       INTEGER NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

**外键关系**:
- `user_id` → `users.id` (一对多)

---

#### 8.6 import_jobs (导入任务表)
```sql
CREATE TABLE import_jobs (
    id              SERIAL PRIMARY KEY,
    imported_by     INTEGER REFERENCES users(id),

    import_type     VARCHAR(20) NOT NULL,  -- excel, api
    file_name       VARCHAR(255),
    file_path       VARCHAR(500),

    status          ENUM(pending, processing, completed, failed),

    total_records   INTEGER,
    success_count   INTEGER DEFAULT 0,
    failed_count    INTEGER DEFAULT 0,

    error_log       JSONB,

    started_at      TIMESTAMP,
    completed_at    TIMESTAMP,

    tenant_id       INTEGER NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

**外键关系**:
- `imported_by` → `users.id`

---

#### 8.7 export_jobs (导出任务表)
```sql
CREATE TABLE export_jobs (
    id              SERIAL PRIMARY KEY,
    exported_by     INTEGER REFERENCES users(id),

    export_type     ENUM(excel, pdf, csv),
    filters         JSONB,

    status          ENUM(processing, completed, failed),

    file_path       VARCHAR(500),
    file_size       INTEGER,
    download_url    VARCHAR(500),

    tenant_id       INTEGER NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

**外键关系**:
- `exported_by` → `users.id`

---

## 表关系图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          IPD 需求管理系统数据库关系图                          │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │     tenants      │
                    │   (租户表)        │
                    └────────┬─────────┘
                             │ 1:N
                             ▼
                    ┌──────────────────┐
                    │      users       │
                    │   (用户表)        │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ requirements  │   │  attachments  │   │ notifications │
│  (需求主表)    │   │  (附件表)      │   │  (通知表)      │
└───────┬───────┘   └───────┬───────┘   └───────────────┘
        │                   │
        │ 1:N               │ 1:N (polymorphic)
        │                   │
        ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│                    需求相关子表                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │requirement_10q  │  │requirement_     │              │
│  │   _answers      │  │  versions       │              │
│  │ (1:1)           │  │  (1:N)          │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │appeals_analysis │  │kano_            │              │
│  │   (1:1)         │  │classification   │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │verification_    │  │verification_    │              │
│  │   records       │  │checklists       │              │
│  │   (1:N)         │  │   (1:N)         │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │verification_    │  │traceability_    │              │
│  │   metrics       │  │   links         │              │
│  │   (1:N)         │  │   (1:N)         │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │feedbacks        │  │reviews          │              │
│  │   (N:1)         │  │   (1:N)         │              │
│  └─────────────────┘  └─────────────────┘              │
└──────────────────────────────────────────────────────────┘

                    需求分发层级关系
                    =================

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│strategic_    │  1:N  │business_     │  1:N  │  charters    │
│   plans      │──────▶│   plans      │──────▶│              │
│   (SP)       │       │   (BP)       │       │              │
└──────────────┘       └──────────────┘       └──────┬───────┘
                                                      │
                                                      │ N:1
                                                      ▼
                                             ┌──────────────┐
                                             │pcr_requests  │
                                             │   (PCR)      │
                                             └──────────────┘

                    CIM 模型关系
                    ============

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│requirements  │  N:M  │requirement_  │  N:1  │cim_          │
│              │──────▶│cim_links     │──────▶│references    │
│              │       │              │       │              │
└──────────────┘       └──────────────┘       └──────────────┘

                    工作流历史
                    =========

                    ┌──────────────┐
                    │workflow_     │
                    │  history     │◀─── 记录所有实体的状态变更
                    └──────────────┘

                    数据导入导出
                    ===========

┌──────────────┐       ┌──────────────┐
│import_jobs   │       │export_jobs   │
│(批量导入)     │       │(批量导出)     │
└──────────────┘       └──────────────┘

```

---

## 核心业务流程

### 1. 需求收集阶段
```
用户收集需求 → requirements (source_channel)
         ↓
    requirement_10q_answers (详细回答)
         ↓
    attachments (收集附件)
```

### 2. 需求分析阶段
```
requirements → appeals_analysis (APPEALS 8维度分析)
         ↓
requirements → kano_classification (KANO 分类)
         ↓
计算优先级 (priority_score, rice_score, moscow_priority)
```

### 3. 需求分发阶段
```
requirements (target_type = "sp") → strategic_plans
requirements (target_type = "bp") → business_plans → strategic_plans
requirements (target_type = "charter") → charters → business_plans
requirements (target_type = "pcr") → pcr_requests
```

### 4. 需求追溯阶段
```
requirements → traceability_links
         ↓
    design_attachments (设计文档)
    code_attachments (代码)
    test_attachments (测试)
```

### 5. 需求验证阶段
```
requirements → verification_records
         ↓
requirements → verification_checklists (FAT/SAT/UAT)
         ↓
requirements → verification_metrics (验证指标)
         ↓
    验证结果反馈 → 更新 requirements.status
```

### 6. 反馈收集阶段
```
feedbacks (用户反馈)
         ↓
    AI 分析 → ai_suggestion, conversion_confidence
         ↓
    转换为需求 → requirement_id (可选)
```

---

## 多租户隔离机制

### 具有 TenantMixin 的表 (自动隔离)
以下表继承 `TenantMixin`，包含 `tenant_id` 字段：

1. `users`
2. `requirements`
3. `requirement_10q_answers`
4. `requirement_versions`
5. `verification_checklists`
6. `verification_metrics`
7. `cim_references`
8. `requirement_cim_links`
9. `feedbacks`
10. `reviews`
11. `notifications`
12. `import_jobs`
13. `export_jobs`

### 隔离规则
- 所有查询自动按 `tenant_id` 过滤
- `tenant_id` 通过 JWT Token 和 HTTP Header `X-Tenant-ID` 传递
- 级联删除保护：租户删除时，相关数据一并删除

---

## 数据完整性约束

### 外键约束 (ON DELETE 策略)

| 外键 | 策略 | 说明 |
|------|------|------|
| `users.tenant_id` | CASCADE | 租户删除，用户也删除 |
| `notifications.user_id` | CASCADE | 用户删除，通知也删除 |
| `requirement_10q_answers.requirement_id` | CASCADE | 需求删除，答案也删除 |
| `requirement_versions.requirement_id` | CASCADE | 需求删除，版本历史也删除 |
| `appeals_analysis.requirement_id` | CASCADE | 需求删除，分析也删除 |
| `kano_classification.requirement_id` | CASCADE | 需求删除，分类也删除 |
| `verification_records.requirement_id` | CASCADE | 需求删除，验证记录也删除 |
| `verification_checklists.requirement_id` | CASCADE | 需求删除，检查清单也删除 |
| `verification_metrics.requirement_id` | CASCADE | 需求删除，指标也删除 |
| `requirement_cim_links.requirement_id` | CASCADE | 需求删除，CIM 链接也删除 |
| `requirement_cim_links.cim_reference_id` | CASCADE | CIM 删除，链接也删除 |
| `traceability_links.design_attachment_id` | SET NULL | 附件删除，字段置空 |
| `traceability_links.code_attachment_id` | SET NULL | 附件删除，字段置空 |
| `traceability_links.test_attachment_id` | SET NULL | 附件删除，字段置空 |
| `feedbacks.requirement_id` | SET NULL | 需求删除，保留反馈记录 |

### 唯一约束
- `users.username`, `users.email`
- `requirements.requirement_no`
- `requirement_10q_answers.requirement_id`
- `appeals_analysis.requirement_id`
- `kano_classification.requirement_id`
- `strategic_plans.sp_code`
- `business_plans.bp_code`
- `charters.charter_code`
- `pcr_requests.pcr_code`
- `cim_references.reference_code`
- `reviews.review_no`
- `feedbacks.feedback_no`

---

## 索引策略

### 主键索引
所有表的 `id` 字段都有主键索引

### 唯一索引
- `users.username`
- `users.email`
- `tenants.code`
- `requirements.requirement_no`
- 所有分发表的 `code` 字段

### 外键索引
- 所有外键字段都有索引以优化 JOIN 查询

### 租户索引
- 所有 `tenant_id` 字段都有索引以支持多租户查询

---

## 数据字典

### 枚举类型

#### 用户角色 (UserRole)
- `admin` - 管理员
- `product_manager` - 产品经理
- `marketing_manager` - 市场经理
- `sales_manager` - 销售经理
- `pm` - 项目经理 (遗留)
- `engineer` - 工程师 (遗留)
- `stakeholder` - 利益相关者

#### 需求状态 (RequirementStatus)
- `collected` - 已收集
- `analyzing` - 分析中
- `analyzed` - 已分析
- `distributing` - 分发中
- `distributed` - 已分发
- `implementing` - 实现中
- `verifying` - 验证中
- `completed` - 已完成
- `rejected` - 已拒绝

#### 来源渠道 (SourceChannel)
- `customer` - 客户
- `market` - 市场
- `competition` - 竞争对手
- `sales` - 销售
- `after_sales` - 售后
- `rd` - 研发

#### 复杂度等级 (ComplexityLevel)
- `low` - 低
- `medium` - 中
- `high` - 高
- `very_high` - 非常高

#### KANO 分类 (KanoCategory)
- `basic` - 基本型
- `performance` - 期望型/性能型
- `excitement` - 兴奋型

#### 验证类型 (VerificationType)
- `fat` - 工厂验收测试
- `sat` - 现场验收测试
- `uat` - 用户验收测试
- `prototype` - 原型验证
- `test` - 测试验证

---

## 性能优化建议

### 1. JSONB 字段查询优化
对于经常查询的 JSONB 字段，可以添加 GIN 索引：
```sql
CREATE INDEX idx_requirements_appeals ON requirements USING GIN (appeals_scores);
CREATE INDEX idx_requirements_customer_10q ON requirements USING GIN (customer_need_10q);
```

### 2. 租户查询优化
在所有多租户表的 `tenant_id` 上建立索引

### 3. 全文搜索
对于 `requirements.title` 和 `requirements.description`，可添加全文搜索索引：
```sql
CREATE INDEX idx_requirements_title_gin ON requirements USING GIN (to_tsvector('english', title));
```

### 4. 分区表
对于数据量大的表（如 `workflow_history`），可考虑按时间分区

---

## 数据迁移建议

### Alembic 迁移文件
- `001_initial_migration.py` - 初始表结构
- `002_add_new_models_and_fields.py` - 新增模型和多租户支持

### 迁移命令
```bash
# 生成迁移
alembic revision --autogenerate -m "描述"

# 执行迁移
alembic upgrade head

# 回滚
alembic downgrade -1
```

---

## 总结

本 IPD 需求管理系统数据库设计具有以下特点：

1. **完整的需求生命周期管理** - 从收集、分析、分发到验证的完整流程
2. **多租户架构** - 通过 `tenant_id` 实现数据隔离
3. **灵活的 JSONB 存储** - 存储复杂分析结果和配置
4. **版本历史跟踪** - `requirement_versions` 和 `workflow_history`
5. **CIM 模型集成** - 支持与 CIM 模型的关联
6. **完整的审核机制** - 反馈、验证、审核全覆盖
7. **分层分发架构** - SP → BP → Charter 的层级关系
8. **追溯矩阵** - RTM 支持设计、代码、测试的追溯

**数据库统计**:
- 总表数: 23 张
- 核心外键关系: 40+ 个
- 枚举类型: 15+ 个
- 支持的业务流程: 6 大阶段
