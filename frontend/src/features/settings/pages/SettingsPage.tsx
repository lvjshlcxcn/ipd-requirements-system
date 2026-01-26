import { Tabs } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { PromptTemplatesPage } from './PromptTemplatesPage'
import type { TemplateKey } from '@/types/prompt'

export function SettingsPage() {
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const defaultPromptTab: TemplateKey = (tabParam === 'quick_insight' ? 'quick_insight' : 'ipd_ten_questions')

  return (
    <div>
      <Tabs defaultActiveKey="prompts" activeKey="prompts">
        <Tabs.TabPane tab="Prompt 模板" key="prompts">
          <PromptTemplatesPage defaultTab={defaultPromptTab} />
        </Tabs.TabPane>
        {/* Future tabs can be added here */}
      </Tabs>
    </div>
  )
}
