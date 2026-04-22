export interface TaskTemplate {
  id: string
  title?: string
  images: string[]
  prompt: string
  createdAt: number
  source: 'wan-video' | 'gemini-image'
}

export interface GeminiTaskTemplate extends TaskTemplate {
  // Add any gemini specific fields here if needed
}
