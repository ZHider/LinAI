export interface TaskTemplate {
  id: string
  type: 'image' | 'video'
  image: string
  prompt: string
  quality: string
  aspectRatio: string
  createdAt: number
  source?: 'wan' | 'gemini'
}
