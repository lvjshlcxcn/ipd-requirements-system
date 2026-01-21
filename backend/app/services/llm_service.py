from openai import AsyncOpenAI
from app.config import get_settings
from typing import Dict, Any
import json
import logging
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)
settings = get_settings()

class LLMService:
    """统一的LLM调用服务"""

    def __init__(self):
        """初始化DeepSeek客户端"""
        self.client = AsyncOpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url=settings.DEEPSEEK_BASE_URL,
            timeout=settings.DEEPSEEK_TIMEOUT
        )
        self.model = settings.DEEPSEEK_MODEL
        self.max_tokens = settings.DEEPSEEK_MAX_TOKENS
        self.temperature = settings.DEEPSEEK_TEMPERATURE

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def analyze_insight(
        self,
        text: str,
        prompt_template: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        使用DeepSeek分析文本洞察

        Args:
            text: 待分析文本
            prompt_template: Prompt模板
            **kwargs: 其他参数

        Returns:
            分析结果JSON
        """
        # 构建完整prompt
        full_prompt = prompt_template.format(text=text)

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个专业的产品需求分析师,擅长从客户访谈中提取真实需求。"
                    },
                    {
                        "role": "user",
                        "content": full_prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                response_format={"type": "json_object"}
            )

            # 解析JSON响应
            result = json.loads(response.choices[0].message.content)
            return result

        except json.JSONDecodeError as e:
            logger.error(f"JSON解析失败: {e}")
            raise Exception("AI返回的不是有效的JSON格式")

        except Exception as e:
            logger.error(f"LLM调用失败: {e}")
            raise Exception(f"AI分析失败: {str(e)}")

    def _validate_analysis_result(self, result: Dict[str, Any]):
        """验证AI返回结果的结构"""
        required_fields = [
            'q1_who', 'q2_why', 'q3_what_problem',
            'q4_current_solution', 'q5_current_issues',
            'q6_ideal_solution', 'q7_priority', 'q8_frequency',
            'q9_impact_scope', 'q10_value'
        ]

        missing_fields = [field for field in required_fields if field not in result]

        if missing_fields:
            raise Exception(f"AI返回结果缺少必要字段: {', '.join(missing_fields)}")

# 单例
llm_service = LLMService()
