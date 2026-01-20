// DeepSeek Logo Component
export function DeepSeekIcon({ width = 24, height = 24 }: { width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* DeepSeek D Logo - 蓝色渐变 */}
      <defs>
        <linearGradient id="deepseekGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#deepseekGradient)" />
      <path
        d="M8 8C8 8 8 8 8 8L12 12L8 16C8 16 8 16 8 16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12 8L16 12L12 16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="12" r="2" fill="white" />
    </svg>
  )
}

// Claude/Anthropic Icon Component
export function ClaudeIcon({ width = 24, height = 24 }: { width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Claude/Anthropic 风格图标 - 橙色/棕色渐变 */}
      <defs>
        <linearGradient id="claudeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4"
        fill="url(#claudeGradient)"
      />
      {/* C 形状的螺旋图案 */}
      <path
        d="M12 7C9.2 7 7 9.2 7 12C7 14.8 9.2 17 12 17C14.8 17 17 14.8 17 12"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="12" r="2.5" fill="white" />
      {/* 小装饰点 */}
      <circle cx="15" cy="9" r="1.5" fill="white" opacity={0.8} />
      <circle cx="9" cy="15" r="1.5" fill="white" opacity={0.8} />
    </svg>
  )
}
