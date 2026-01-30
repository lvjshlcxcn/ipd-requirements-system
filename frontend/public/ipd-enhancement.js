// IPD Story Flow Enhancement - 保存和查询功能
(function() {
    'use strict';
    
    let savedWorkflowId = null;
    const API_BASE = '/api/v1/ipd-story';
    
    // 初始化
    function init() {
        setTimeout(() => {
            // 在步骤条同一行添加按钮
            const stepsContainer = document.querySelector('.steps');
            if (stepsContainer) {
                // 修改步骤条容器样式，使其支持左右两侧元素
                stepsContainer.style.display = 'flex';
                stepsContainer.style.justifyContent = 'center';
                stepsContainer.style.alignItems = 'center';
                stepsContainer.style.position = 'relative';

                // 左侧：AI 洞察分析按钮
                const insightBtn = document.createElement('button');
                insightBtn.className = 'btn';
                insightBtn.textContent = '📊 AI洞察分析';
                insightBtn.title = '打开 AI 洞察分析';
                insightBtn.id = 'step3InsightBtn';
                insightBtn.style.position = 'absolute';
                insightBtn.style.left = '20px';
                insightBtn.style.padding = '6px 12px';
                insightBtn.style.fontSize = '13px';
                insightBtn.style.cursor = 'pointer';
                insightBtn.style.border = '1px solid #d9d9d9';
                insightBtn.style.borderRadius = '4px';
                insightBtn.style.background = 'white';
                insightBtn.style.transition = 'all 0.3s';
                insightBtn.style.display = 'flex';
                insightBtn.style.alignItems = 'center';
                insightBtn.style.gap = '4px';
                insightBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    // 通知父页面打开文本洞察分析弹窗
                    if (window.parent !== window) {
                        window.parent.postMessage({ type: 'OPEN_TEXT_INSIGHT_MODAL' }, '*');
                    }
                };

                // 添加悬停效果
                insightBtn.onmouseenter = function() {
                    this.style.color = '#1890ff';
                    this.style.borderColor = '#1890ff';
                    this.style.background = '#e6f7ff';
                };
                insightBtn.onmouseleave = function() {
                    this.style.color = '';
                    this.style.borderColor = '#d9d9d9';
                    this.style.background = 'white';
                };

                stepsContainer.appendChild(insightBtn);
                console.log('✅ 步骤条左侧 AI 洞察按钮已添加');

                // 右侧：历史记录按钮
                const historyBtn = document.createElement('button');
                historyBtn.className = 'btn';
                historyBtn.textContent = '📋 打开用户故事卡片';
                historyBtn.title = '打开历史记录';
                historyBtn.id = 'step3HistoryBtn';
                historyBtn.style.position = 'absolute';
                historyBtn.style.right = '20px';
                historyBtn.style.padding = '6px 12px';
                historyBtn.style.fontSize = '13px';
                historyBtn.style.cursor = 'pointer';
                historyBtn.style.border = '1px solid #d9d9d9';
                historyBtn.style.borderRadius = '4px';
                historyBtn.style.background = 'white';
                historyBtn.style.transition = 'all 0.3s';
                historyBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    showHistoryModal();
                };

                // 添加悬停效果
                historyBtn.onmouseenter = function() {
                    this.style.color = '#1890ff';
                    this.style.borderColor = '#1890ff';
                };
                historyBtn.onmouseleave = function() {
                    this.style.color = '';
                    this.style.borderColor = '#d9d9d9';
                };

                stepsContainer.appendChild(historyBtn);
                console.log('✅ 步骤条右侧历史记录按钮已添加');
            }

            // 添加保存按钮到导出区域
            const exportSection = document.querySelector('.export-section .button-group');
            if (exportSection) {
                // 保存按钮
                const saveBtn = document.createElement('button');
                saveBtn.className = 'btn btn-primary';
                saveBtn.textContent = '💾 保存到数据库';
                saveBtn.id = 'saveDatabaseBtn';
                saveBtn.onclick = saveToDatabase;

                // 历史记录按钮
                const historyBtn = document.createElement('button');
                historyBtn.className = 'btn btn-secondary';
                historyBtn.textContent = '📋 查看历史记录';
                historyBtn.id = 'viewHistoryBtn';
                historyBtn.onclick = showHistoryModal;

                exportSection.insertBefore(saveBtn, exportSection.firstChild);
                exportSection.insertBefore(historyBtn, saveBtn.nextSibling);

                console.log('✅ INVEST 导出区域按钮已添加');
            }
        }, 500);
    }
    
    // 获取认证headers
    function getAuthHeaders() {
        // 尝试从多个来源获取token
        let token = null;

        // 1. 从iframe的localStorage
        try {
            token = localStorage.getItem('access_token');
        } catch (e) {}

        // 2. 从URL参数
        if (!token) {
            const urlParams = new URLSearchParams(window.location.search);
            token = urlParams.get('token');
        }

        // 3. 从cookie
        if (!token) {
            const match = document.cookie.match(/access_token=([^;]+)/);
            if (match) {
                token = match[1];
            }
        }

        // 4. 从sessionStorage
        if (!token) {
            try {
                token = sessionStorage.getItem('access_token');
            } catch (e) {}
        }

        const tenantId = localStorage.getItem('tenant_id') || '1';
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        headers['X-Tenant-ID'] = tenantId;

        return headers;
    }
    
    // 保存到数据库
    async function saveToDatabase() {
        // 检查数据
        if (typeof ipdData === 'undefined' || !ipdData || Object.keys(ipdData).length === 0) {
            alert('请先完成IPD需求十问表单');
            return;
        }

        const saveBtn = document.getElementById('saveDatabaseBtn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '⏳ 保存中...';
        saveBtn.disabled = true;

        try {
            // 清理ipdData - 移除空字符串的可选字段
            const cleanedIpdData = {};
            for (const key in ipdData) {
                if (ipdData[key] !== '') {
                    cleanedIpdData[key] = ipdData[key];
                }
            }

            // 转换字段名以匹配后端schema
            const userStoryData = {
                title: userStory.title,
                role: userStory.role,
                action: userStory.action,
                benefit: userStory.benefit,
                priority: (cleanedIpdData.q7_priority || 'medium'),
                frequency: (cleanedIpdData.q8_frequency || 'daily'),
                acceptance_criteria: userStory.acceptanceCriteria || []
            };

            const payload = {
                ipd_data: cleanedIpdData,
                user_story: userStoryData,
                invest_analysis: {
                    scores: investScores,
                    total_score: calculateInvestTotalScore(),  // 总分（0-600）
                    average_score: calculateTotalScore()  // 平均分（0-100）
                }
            };
            
            const response = await fetch(API_BASE + '/workflow', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                alert('保存成功!\n\n工作流ID: ' + result.data.id);
                savedWorkflowId = result.data.id;
            } else {
                console.error('Save failed response:', result);
                console.error('Payload:', payload);
                const errorMsg = result.detail?.message || result.message || result.detail || '未知错误';
                alert('保存失败: ' + errorMsg + '\n\n请查看浏览器控制台获取详细信息');
            }
        } catch (error) {
            console.error('Save error:', error);
            console.error('Payload:', payload);
            alert('保存失败: ' + error.message);
        } finally {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    }

    // 计算 INVEST 总分（6个维度之和，范围 0-600）
    function calculateInvestTotalScore() {
        const scores = Object.values(investScores);
        return scores.reduce((a, b) => a + b, 0);
    }

    // 获取建议列表
    function getSuggestionsList() {
        const suggestions = [];
        const scores = investScores;
        
        if (scores.independent < 60) {
            suggestions.push('独立性较低：尝试将需求拆分为更小、更独立的功能模块');
        }
        if (scores.negotiable < 60) {
            suggestions.push('可协商性不足：与团队讨论是否有替代方案或简化实现的方式');
        }
        if (scores.valuable < 60) {
            suggestions.push('价值性不明确：重新评估需求的业务价值和用户收益');
        }
        if (scores.estimable < 60) {
            suggestions.push('可估算性差：需求可能过于模糊，需要进一步细化和澄清');
        }
        if (scores.small < 60) {
            suggestions.push('规模偏大：考虑将需求拆分为多个小的用户故事');
        }
        if (scores.testable < 60) {
            suggestions.push('可测试性不足：定义明确的验收标准和测试场景');
        }
        
        if (suggestions.length === 0) {
            suggestions.push('各项指标表现良好！这是一个高质量的用户故事。');
        }
        
        return suggestions;
    }
    
    // 显示历史记录
    async function showHistoryModal() {
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:9999;';

        const content = document.createElement('div');
        content.style.cssText = 'background:white;border-radius:8px;padding:30px;max-width:900px;max-height:80vh;overflow-y:auto;width:90%;';

        content.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:1px solid #f0f0f0;padding-bottom:15px;">' +
            '<h2 style="margin:0;">历史记录</h2>' +
            '<div style="display:flex;gap:10px;">' +
            '<button class="btn btn-primary" id="exportAllBtn" style="padding:6px 16px;font-size:14px;">📥 导出所有</button>' +
            '<button class="btn btn-secondary" id="closeModalBtn" style="padding:6px 16px;font-size:14px;">✕ 关闭</button>' +
            '</div>' +
            '</div>' +
            '<div style="margin-bottom:20px;display:flex;gap:10px;">' +
            '<input type="text" id="searchInput" placeholder="搜索标题或角色..." style="flex:1;padding:8px 12px;border:1px solid #d9d9d9;border-radius:4px;font-size:14px;" />' +
            '<button id="searchBtn" class="btn btn-secondary">🔍 搜索</button>' +
            '<button id="clearSearchBtn" class="btn btn-secondary" style="display:none;">清除</button>' +
            '</div>' +
            '<div id="historyList">加载中...</div>';

        modal.className = 'ipd-modal';
        modal.appendChild(content);
        document.body.appendChild(modal);

        document.getElementById('closeModalBtn').onclick = function() {
            document.body.removeChild(modal);
        };

        document.getElementById('exportAllBtn').onclick = function() {
            exportAllHistory();
        };

        // 搜索功能
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const clearSearchBtn = document.getElementById('clearSearchBtn');

        const doSearch = function() {
            const keyword = searchInput.value.trim();
            loadHistoryList(keyword);
            if (keyword) {
                clearSearchBtn.style.display = 'inline-block';
            } else {
                clearSearchBtn.style.display = 'none';
            }
        };

        searchBtn.onclick = doSearch;
        searchInput.onkeypress = function(e) {
            if (e.key === 'Enter') doSearch();
        };

        clearSearchBtn.onclick = function() {
            searchInput.value = '';
            loadHistoryList();
            clearSearchBtn.style.display = 'none';
        };

        loadHistoryList();
    }

    // 加载历史列表
    async function loadHistoryList(searchKeyword = '') {
        const listContainer = document.getElementById('historyList');

        try {
            let url = '/workflows?skip=0&limit=20&order_by_invest=true';
            if (searchKeyword) {
                url += '&search=' + encodeURIComponent(searchKeyword);
            }

            const response = await fetch(API_BASE + url, {
                headers: getAuthHeaders()
            });

            const result = await response.json();

            if (result.success && result.data.data.length > 0) {
                const workflows = result.data.data;
                listContainer.innerHTML = workflows.map(function(w) {
                    // 显示平均分（0-100），更直观
                    const averageScore = w.invest_analysis ? w.invest_analysis.average_score || 0 : 0;
                    const scoreColor = averageScore >= 80 ? '#52c41a' : averageScore >= 60 ? '#faad14' : '#ff4d4f';
                    const title = w.user_story && w.user_story.title ? w.user_story.title : '未命名';
                    const role = w.user_story && w.user_story.role ? w.user_story.role : '-';
                    const priority = w.ipd_data && w.ipd_data.q7_priority ? w.ipd_data.q7_priority : '-';
                    const date = w.created_at ? new Date(w.created_at).toLocaleString('zh-CN') : '-';

                    return '<div style="border:1px solid #f0f0f0;border-radius:8px;padding:15px;margin-bottom:15px;" class="workflow-card">' +
                        '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
                        '<div style="flex:1;cursor:pointer;" class="workflow-card-content" data-workflow-id="' + w.workflow_id + '" onmouseover="this.style.opacity=\'0.7\'" onmouseout="this.style.opacity=\'1\'">' +
                        '<h4 style="margin:0 0 8px 0;color:#1890ff;">' + title + '</h4>' +
                        '<p style="margin:4px 0;color:#666;font-size:14px;"><strong>角色:</strong> ' + role + '</p>' +
                        '<p style="margin:4px 0;color:#666;font-size:14px;"><strong>优先级:</strong> ' + priority + '</p>' +
                        (w.invest_analysis ? '<p style="margin:4px 0;color:#666;font-size:14px;"><strong>INVEST评分:</strong> <span style="color:' + scoreColor + ';font-weight:bold;">' + averageScore + '</span></p>' : '') +
                        '<p style="margin:4px 0;color:#999;font-size:12px;">' + date + '</p>' +
                        '</div>' +
                        '<div style="margin-left:15px;">' +
                        '<button class="delete-workflow-btn" data-workflow-id="' + w.workflow_id + '" data-title="' + title + '" style="padding:6px 12px;background:#ff4d4f;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;">🗑️ 删除</button>' +
                        '</div>' +
                        '</div>' +
                        '</div>';
                }).join('');

                // 添加事件委托
                setupHistoryListEventDelegation(listContainer);

                listContainer.innerHTML += '<p style="color:#999;text-align:center;margin-top:20px;">共 ' + result.data.total + ' 条记录</p>';
            } else {
                listContainer.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">暂无历史记录</p>';
            }
        } catch (error) {
            console.error('Load error:', error);
            listContainer.innerHTML = '<p style="color:#ff4d4f;text-align:center;">加载失败: ' + error.message + '</p>';
        }
    }

    // 设置历史列表的事件委托
    function setupHistoryListEventDelegation(listContainer) {
        // 移除旧的事件监听器（如果有）
        listContainer.removeEventListener('click', handleHistoryListClick);
        // 添加新的事件监听器
        listContainer.addEventListener('click', handleHistoryListClick);
    }

    // 处理历史列表的点击事件
    async function handleHistoryListClick(evt) {
        // 处理删除按钮点击
        const deleteBtn = evt.target.closest('.delete-workflow-btn');
        if (deleteBtn) {
            evt.stopPropagation();
            const workflowId = deleteBtn.getAttribute('data-workflow-id');
            const title = deleteBtn.getAttribute('data-title');
            // 直接传递按钮元素，而不是整个事件对象
            await deleteWorkflow(workflowId, title, deleteBtn);
            return;
        }

        // 处理卡片内容点击（加载工作流）
        const cardContent = evt.target.closest('.workflow-card-content');
        if (cardContent) {
            const workflowId = cardContent.getAttribute('data-workflow-id');
            loadWorkflow(workflowId);
            return;
        }
    }
    
    // 加载工作流详情
    async function loadWorkflow(workflowId) {
        try {
            const response = await fetch(API_BASE + '/workflow/' + workflowId, {
                headers: getAuthHeaders()
            });
            
            const result = await response.json();
            
            if (result.success) {
                const workflow = result.data;

                console.log('加载的工作流数据:', workflow);

                // 设置数据并填充 IPD 表单
                if (workflow.ipd_data) {
                    window.ipdData = workflow.ipd_data;

                    // 填充 IPD 表单字段
                    const ipdFields = [
                        'q1_who', 'q2_why', 'q3_what_problem', 'q4_current_solution',
                        'q5_current_issues', 'q6_ideal_solution', 'q9_expected_value', 'q10_success_metrics'
                    ];

                    ipdFields.forEach(function(fieldId) {
                        const input = document.getElementById(fieldId);
                        if (input && workflow.ipd_data[fieldId]) {
                            input.value = workflow.ipd_data[fieldId];
                        }
                    });

                    // 处理优先级下拉框
                    if (workflow.ipd_data.q7_priority) {
                        const prioritySelect = document.getElementById('q7_priority');
                        if (prioritySelect) {
                            prioritySelect.value = workflow.ipd_data.q7_priority;
                        }
                    }

                    // 处理频次下拉框
                    if (workflow.ipd_data.q8_frequency) {
                        const freqSelect = document.getElementById('q8_frequency');
                        if (freqSelect) {
                            freqSelect.value = workflow.ipd_data.q8_frequency;
                        }
                    }
                }
                
                if (workflow.user_story) {
                    const userStoryData = {
                        title: workflow.user_story.title,
                        role: workflow.user_story.role,
                        action: workflow.user_story.action,
                        benefit: workflow.user_story.benefit,
                        // 后端返回 acceptance_criteria，转换为 acceptanceCriteria
                        acceptanceCriteria: workflow.user_story.acceptance_criteria || []
                    };
                    window.userStory = userStoryData;

                    // 显示用户故事
                    document.getElementById('storyTitle').textContent = workflow.user_story.title || '用户故事';
                    document.getElementById('storyRole').textContent = workflow.user_story.role || '-';
                    document.getElementById('storyAction').textContent = workflow.user_story.action || '-';
                    document.getElementById('storyBenefit').textContent = workflow.user_story.benefit || '-';

                    const criteriaList = document.getElementById('storyAcceptanceCriteria');
                    criteriaList.innerHTML = '';
                    // 后端返回 acceptance_criteria，转换为 acceptanceCriteria
                    const criteria = workflow.user_story.acceptance_criteria || workflow.user_story.acceptanceCriteria || [];
                    if (criteria.length > 0) {
                        criteria.forEach(function(c) {
                            const li = document.createElement('li');
                            li.textContent = c;
                            criteriaList.appendChild(li);
                        });
                    }
                }
                
                if (workflow.invest_analysis) {
                    window.investScores = workflow.invest_analysis.scores || window.investScores;
                    
                    // 更新滑块
                    Object.keys(window.investScores).forEach(function(key) {
                        const slider = document.getElementById(key);
                        const valueDisplay = document.getElementById(key + 'Value');
                        if (slider) slider.value = window.investScores[key];
                        if (valueDisplay) valueDisplay.textContent = window.investScores[key];
                    });
                    
                    // 重绘图表
                    if (typeof drawRadarChart === 'function') {
                        drawRadarChart();
                    }
                    if (typeof updateScoreDisplay === 'function') {
                        updateScoreDisplay();
                    }
                    if (typeof generateSuggestions === 'function') {
                        generateSuggestions();
                    }
                }

                // 关闭模态框
                const modal = document.querySelector('.ipd-modal');
                if (modal) {
                    document.body.removeChild(modal);
                }

                // 跳转到步骤 1（IPD 表单），让用户可以看到填充的数据
                if (typeof switchSection === 'function') {
                    switchSection(1);
                }

                console.log('✅ 数据已加载，workflow_id:', workflowId);
            } else {
                alert('加载失败: ' + (result.message || '未知错误'));
            }
        } catch (error) {
            console.error('Load workflow error:', error);
            alert('加载失败: ' + error.message);
        }
    }

    // 删除工作流
    async function deleteWorkflow(workflowId, title, deleteBtn) {
        if (!confirm('确定要删除 "' + title + '" 吗？\n\n此操作将删除整个工作流，包括 IPD 十问、用户故事和 INVEST 分析，无法恢复。')) {
            return;
        }

        // 禁用删除按钮，防止重复点击
        // deleteBtn 现在是直接传递的按钮元素
        deleteBtn.disabled = true;
        deleteBtn.textContent = '删除中...';

        try {
            const response = await fetch(API_BASE + '/workflow/' + workflowId, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ 删除成功！');
                // 重新加载列表
                await loadHistoryList();
            } else {
                alert('❌ 删除失败: ' + (result.message || '未知错误'));
                // 恢复删除按钮
                deleteBtn.disabled = false;
                deleteBtn.textContent = '🗑️ 删除';
            }
        } catch (error) {
            console.error('Delete workflow error:', error);
            alert('❌ 删除失败: ' + error.message);
            // 恢复删除按钮
            deleteBtn.disabled = false;
            deleteBtn.textContent = '🗑️ 删除';
        }
    }

    // 导出所有历史记录
    async function exportAllHistory() {
        const exportBtn = document.getElementById('exportAllBtn');
        const originalText = exportBtn.textContent;
        exportBtn.textContent = '⏳ 导出中...';
        exportBtn.disabled = true;

        try {
            // 获取所有历史记录（不分页，获取全部）
            let allWorkflows = [];
            let skip = 0;
            const limit = 100;
            let hasMore = true;

            while (hasMore) {
                const response = await fetch(API_BASE + '/workflows?skip=' + skip + '&limit=' + limit, {
                    headers: getAuthHeaders()
                });

                const result = await response.json();

                if (result.success && result.data.data.length > 0) {
                    allWorkflows = allWorkflows.concat(result.data.data);
                    skip += limit;

                    // 如果返回的数据少于 limit，说明已经没有更多数据了
                    if (result.data.data.length < limit) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }
            }

            if (allWorkflows.length === 0) {
                alert('❌ 没有历史记录可以导出');
                return;
            }

            // 导出为 JSON 文件
            const exportData = {
                export_time: new Date().toISOString(),
                total_count: allWorkflows.length,
                workflows: allWorkflows
            };

            const json = JSON.stringify(exportData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ipd-story-history-' + new Date().toISOString().slice(0, 10) + '.json';
            a.click();
            URL.revokeObjectURL(url);

            alert('✅ 导出成功！共导出 ' + allWorkflows.length + ' 条历史记录');
        } catch (error) {
            console.error('Export error:', error);
            alert('❌ 导出失败: ' + error.message);
        } finally {
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
        }
    }

    // 暴露到全局
    window.ipdEnhancement = {
        loadWorkflow: loadWorkflow,
        deleteWorkflow: deleteWorkflow
    };
    
    // 监听来自父页面的消息（用于接收 AI 洞察分析结果）
    window.addEventListener('message', function(event) {
        // 安全检查：只接受来自同源的消息
        // 在生产环境中应该检查 event.origin
        if (event.data && event.data.type === 'INSIGHT_ANALYSIS_RESULT') {
            console.log('收到 AI 洞察分析结果:', event.data.result);
            fillIPDFormFromInsight(event.data.result);
        }
    });

    // 将 AI 洞察分析结果填充到 IPD 表单
    function fillIPDFormFromInsight(result) {
        // 切换到步骤1（IPD 表单）
        if (typeof switchSection === 'function') {
            switchSection(1);
        }

        // 等待 DOM 更新后填充表单
        setTimeout(function() {
            // 填充 IPD 十问字段
            const fieldMappings = [
                { id: 'q1_who', value: result.q1_who },
                { id: 'q2_why', value: result.q2_why },
                { id: 'q3_what_problem', value: result.q3_what_problem },
                { id: 'q4_current_solution', value: result.q4_current_solution },
                { id: 'q5_current_issues', value: result.q5_current_issues },
                { id: 'q6_ideal_solution', value: result.q6_ideal_solution },
                { id: 'q7_priority', value: result.q7_priority },
                { id: 'q8_frequency', value: result.q8_frequency },
                { id: 'q9_expected_value', value: result.q9_impact_scope },
                { id: 'q10_success_metrics', value: result.q10_value }
            ];

            fieldMappings.forEach(function(mapping) {
                const input = document.getElementById(mapping.id);
                if (input && mapping.value) {
                    input.value = mapping.value;
                    // 触发 change 事件，确保数据绑定生效
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });

            // 更新全局 ipdData
            if (typeof window.ipdData === 'undefined') {
                window.ipdData = {};
            }
            fieldMappings.forEach(function(mapping) {
                if (mapping.value) {
                    window.ipdData[mapping.id] = mapping.value;
                }
            });

            // 显示成功消息
            alert('✅ AI 洞察分析已完成，IPD 表单已自动填充！\n\n请检查并完善信息。');

            console.log('✅ IPD 表单已填充完成');
        }, 300);
    }

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('IPD增强功能已加载');
})();
