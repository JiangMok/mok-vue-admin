/**
 * AI系统提示词配置类型
 */
export interface AiSystemPromptConfig {
  id: string
  aiAnalysisRequestType: string
  systemPrompt: string
  createTime?: string
  updateTime?: string
  createBy: string
  createByName?: string
}

/**
 * AI系统提示词配置表单数据（createBy 由后端自动取当前登录人，前端不需要传）
 */
export interface AiSystemPromptConfigFormData {
  id?: string
  aiAnalysisRequestType: string
  systemPrompt: string
}
