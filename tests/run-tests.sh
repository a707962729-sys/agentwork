#!/bin/bash
# AgentWork API 自动化测试脚本

API="http://localhost:3000"
REPORT="/Users/mac/Desktop/agentwork/tests/test-results.md"

echo "# AgentWork API 测试报告" > $REPORT
echo "" >> $REPORT
echo "**测试时间**: $(date '+%Y-%m-%d %H:%M:%S')" >> $REPORT
echo "" >> $REPORT

# 计数器
PASS=0
FAIL=0
TOTAL=0

test_case() {
    local id=$1
    local name=$2
    local cmd=$3
    local expected=$4
    
    TOTAL=$((TOTAL + 1))
    echo "" >> $REPORT
    echo "### $id: $name" >> $REPORT
    
    result=$(eval "$cmd" 2>/dev/null)
    status=$?
    
    if [[ $status -eq 0 && "$result" == *"$expected"* ]]; then
        echo "- ✅ **通过**" >> $REPORT
        PASS=$((PASS + 1))
    else
        echo "- ❌ **失败**" >> $REPORT
        FAIL=$((FAIL + 1))
    fi
    
    echo -e "\`\`\`json\n$result\n\`\`\`" >> $REPORT
}

echo "开始执行测试..."
echo ""

# ========== 黑盒测试 ==========

echo "## 一、黑盒测试结果" >> $REPORT

# TC-B001: 获取任务列表
echo "执行 TC-B001..."
test_case "TC-B001" "获取任务列表" \
    "curl -s $API/api/v1/tasks" \
    '"tasks"'

# TC-B002: 创建任务 - 正常
echo "执行 TC-B002..."
TASK_ID=$(curl -s -X POST $API/api/v1/tasks \
    -H "Content-Type: application/json" \
    -d '{"title":"黑盒测试任务"}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_case "TC-B002" "创建任务 - 正常" \
    "curl -s -X POST $API/api/v1/tasks -H 'Content-Type: application/json' -d '{\"title\":\"测试任务\"}'" \
    '"id"'

# TC-B003: 创建任务 - 缺少必填字段
echo "执行 TC-B003..."
test_case "TC-B003" "创建任务 - 缺少必填字段" \
    "curl -s -X POST $API/api/v1/tasks -H 'Content-Type: application/json' -d '{}'" \
    'error'

# TC-B004: 创建任务 - 空标题
echo "执行 TC-B004..."
test_case "TC-B004" "创建任务 - 空标题" \
    "curl -s -X POST $API/api/v1/tasks -H 'Content-Type: application/json' -d '{\"title\":\"\"}'" \
    'error'

# TC-B005: 创建任务 - 超长标题
echo "执行 TC-B005..."
LONG_TITLE=$(python3 -c "print('x'*1001)")
test_case "TC-B005" "创建任务 - 超长标题" \
    "curl -s -X POST $API/api/v1/tasks -H 'Content-Type: application/json' -d '{\"title\":\"$LONG_TITLE\"}'" \
    'id'

# TC-B006: 获取单个任务
echo "执行 TC-B006..."
test_case "TC-B006" "获取单个任务" \
    "curl -s $API/api/v1/tasks/$TASK_ID" \
    '"title"'

# TC-B007: 获取不存在的任务
echo "执行 TC-B007..."
test_case "TC-B007" "获取不存在的任务" \
    "curl -s -w '%{http_code}' $API/api/v1/tasks/non-existent-id-12345" \
    '404'

# TC-B008: 执行任务
echo "执行 TC-B008..."
test_case "TC-B008" "执行任务" \
    "curl -s -X POST $API/api/v1/tasks/$TASK_ID/run" \
    'success'

# TC-B009: 暂停任务
echo "执行 TC-B009..."
test_case "TC-B009" "暂停任务" \
    "curl -s -X POST $API/api/v1/tasks/$TASK_ID/pause" \
    'paused'

# TC-B010: 取消任务
echo "执行 TC-B010..."
NEW_TASK=$(curl -s -X POST $API/api/v1/tasks -H 'Content-Type: application/json' -d '{"title":"取消测试"}')
NEW_ID=$(echo $NEW_TASK | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
test_case "TC-B010" "取消任务" \
    "curl -s -X POST $API/api/v1/tasks/$NEW_ID/cancel" \
    'cancelled'

# TC-B011: 删除任务
echo "执行 TC-B011..."
DEL_TASK=$(curl -s -X POST $API/api/v1/tasks -H 'Content-Type: application/json' -d '{"title":"删除测试"}')
DEL_ID=$(echo $DEL_TASK | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
test_case "TC-B011" "删除任务" \
    "curl -s -X DELETE $API/api/v1/tasks/$DEL_ID" \
    'success'

# ========== 技能 API 测试 ==========

echo "" >> $REPORT
echo "### 技能管理 API 测试" >> $REPORT

# TC-B012: 获取技能列表
echo "执行 TC-B012..."
test_case "TC-B012" "获取技能列表" \
    "curl -s $API/api/v1/skills" \
    '"skills"'

# TC-B013: 搜索技能
echo "执行 TC-B013..."
test_case "TC-B013" "搜索技能" \
    "curl -s '$API/api/v1/skills/search?q=code'" \
    '"skills"'

# TC-B014: 搜索技能 - 无关键词
echo "执行 TC-B014..."
test_case "TC-B014" "搜索技能 - 无关键词" \
    "curl -s -w '%{http_code}' '$API/api/v1/skills/search'" \
    '400'

# TC-B015: 获取单个技能
echo "执行 TC-B015..."
test_case "TC-B015" "获取单个技能" \
    "curl -s $API/api/v1/skills/article-writing" \
    '"name"'

# TC-B016: 获取不存在的技能
echo "执行 TC-B016..."
test_case "TC-B016" "获取不存在的技能" \
    "curl -s -w '%{http_code}' $API/api/v1/skills/non-existent-skill" \
    '404'

# ========== 对话 API 测试 ==========

echo "" >> $REPORT
echo "### 对话 API 测试" >> $REPORT

# TC-B017: 创建任务意图
echo "执行 TC-B017..."
test_case "TC-B017" "对话 - 创建任务意图" \
    "curl -s -X POST $API/api/v1/chat -H 'Content-Type: application/json' -d '{\"message\":\"创建任务 \\\"对话测试\\\"\"}'" \
    '已创建任务'

# TC-B018: 任务列表意图
echo "执行 TC-B018..."
test_case "TC-B018" "对话 - 任务列表意图" \
    "curl -s -X POST $API/api/v1/chat -H 'Content-Type: application/json' -d '{\"message\":\"任务列表\"}'" \
    '任务列表'

# TC-B019: 帮助意图
echo "执行 TC-B019..."
test_case "TC-B019" "对话 - 帮助意图" \
    "curl -s -X POST $API/api/v1/chat -H 'Content-Type: application/json' -d '{\"message\":\"帮助\"}'" \
    'AgentWork 助手'

# TC-B020: 空消息
echo "执行 TC-B020..."
test_case "TC-B020" "对话 - 空消息" \
    "curl -s -w '%{http_code}' -X POST $API/api/v1/chat -H 'Content-Type: application/json' -d '{\"message\":\"\"}'" \
    '400'

# ========== 边界测试 ==========

echo "" >> $REPORT
echo "### 边界测试" >> $REPORT

# TC-B021: 任务列表分页
echo "执行 TC-B021..."
test_case "TC-B021" "任务列表分页 limit=1" \
    "curl -s '$API/api/v1/tasks?limit=1'" \
    '"tasks"'

# TC-B022: 任务列表负数 limit
echo "执行 TC-B022..."
test_case "TC-B022" "任务列表负数 limit" \
    "curl -s '$API/api/v1/tasks?limit=-1'" \
    '"tasks"'

# ========== 安全测试 ==========

echo "" >> $REPORT
echo "## 二、安全测试结果" >> $REPORT

# TC-S001: SQL 注入测试
echo "执行 TC-S001..."
test_case "TC-S001" "SQL 注入测试" \
    "curl -s -X POST $API/api/v1/tasks -H 'Content-Type: application/json' -d '{\"title\":\"'; DROP TABLE tasks; --\"}'" \
    'id'

# TC-S002: XSS 测试
echo "执行 TC-S002..."
test_case "TC-S002" "XSS 测试" \
    "curl -s -X POST $API/api/v1/tasks -H 'Content-Type: application/json' -d '{\"title\":\"<script>alert(1)</script>\"}'" \
    'id'

# TC-S003: 路径遍历测试
echo "执行 TC-S003..."
test_case "TC-S003" "路径遍历测试" \
    "curl -s -w '%{http_code}' $API/api/v1/skills/../../../etc/passwd" \
    '400'

# ========== 汇总 ==========

echo "" >> $REPORT
echo "---" >> $REPORT
echo "" >> $REPORT
echo "## 测试汇总" >> $REPORT
echo "" >> $REPORT
echo "| 指标 | 数值 |" >> $REPORT
echo "|------|------|" >> $REPORT
echo "| 测试用例总数 | $TOTAL |" >> $REPORT
echo "| 通过数 | $PASS |" >> $REPORT
echo "| 失败数 | $FAIL |" >> $REPORT
echo "| 通过率 | $((PASS * 100 / TOTAL))% |" >> $REPORT
echo "" >> $REPORT

if [ $FAIL -eq 0 ]; then
    echo "## ✅ 交付建议: **可交付**" >> $REPORT
else
    echo "## ⚠️ 交付建议: **需修复后交付**" >> $REPORT
fi

echo ""
echo "测试完成！"
echo "总用例: $TOTAL"
echo "通过: $PASS"
echo "失败: $FAIL"
echo ""
echo "测试报告: $REPORT"