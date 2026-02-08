#!/bin/bash

echo "================================================================================"
echo "                    运行所有测试 - 完整测试套件"
echo "================================================================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 函数：运行测试并记录结果
run_tests() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${YELLOW}运行: ${test_name}${NC}"
    echo "命令: ${test_command}"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✓ ${test_name} 通过${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}✗ ${test_name} 失败${NC}"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
    echo ""
}

# 激活虚拟环境
source .venv/bin/activate

echo "阶段 1: 后端集成测试"
echo "================================================================================"
run_tests "API集成测试" "pytest tests/integration/test_api/test_requirement_review_meetings_api.py -v --tb=short"
run_tests "新API端点测试" "pytest tests/integration/test_api/test_current_next_voter_api.py -v --tb=short"
run_tests "并发投票测试" "pytest tests/integration/test_api/test_concurrent_voting.py -v --tb=short"

echo ""
echo "阶段 2: 后端单元测试"
echo "================================================================================"
run_tests "Service层单元测试" "pytest tests/unit/test_services/test_requirement_review_meeting_service.py -v --tb=short"

echo ""
echo "阶段 3: 覆盖率报告"
echo "================================================================================"
pytest tests/ -v --cov=app --cov-report=term --cov-report=html \
    --tb=short \
    --ignore=tests/integration/test_api/test_concurrent_voting.py

echo ""
echo "================================================================================"
echo "                            测试总结"
echo "================================================================================"
echo -e "总测试套件: ${TOTAL_TESTS}"
echo -e "${GREEN}通过: ${PASSED_TESTS}${NC}"
echo -e "${RED}失败: ${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  存在失败的测试，请修复后重试${NC}"
    exit 1
fi
