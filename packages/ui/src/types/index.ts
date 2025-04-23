export interface OptimizeVersion {
  id: number
  content: string
  timestamp: number
}

export interface Template {
  id: string
  name: string
  content: string
  type: 'optimize' | 'iterate'
  createdAt: number
  updatedAt: number
} 