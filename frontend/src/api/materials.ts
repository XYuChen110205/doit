import type { MaterialItem, MaterialType } from '../types/wechat-note'

export const MATERIALS_KEY = 'material_library'

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 获取所有素材
export async function listMaterials(): Promise<MaterialItem[]> {
  const data = localStorage.getItem(MATERIALS_KEY)
  if (!data) return []
  return JSON.parse(data) as MaterialItem[]
}

// 按类型获取素材
export async function getMaterialsByType(type: MaterialType): Promise<MaterialItem[]> {
  const materials = await listMaterials()
  return materials.filter(m => m.type === type)
}

// 创建素材
export async function createMaterial(material: Omit<MaterialItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaterialItem> {
  const materials = await listMaterials()
  
  const newMaterial: MaterialItem = {
    ...material,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  materials.unshift(newMaterial)
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials))
  
  return newMaterial
}

// 更新素材
export async function updateMaterial(id: string, updates: Partial<MaterialItem>): Promise<MaterialItem> {
  const materials = await listMaterials()
  const index = materials.findIndex(m => m.id === id)
  if (index === -1) throw new Error('素材不存在')
  
  materials[index] = { 
    ...materials[index], 
    ...updates, 
    updatedAt: new Date().toISOString() 
  }
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials))
  
  return materials[index]
}

// 删除素材
export async function deleteMaterial(id: string): Promise<void> {
  const materials = await listMaterials()
  const filtered = materials.filter(m => m.id !== id)
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(filtered))
}

// 搜索素材
export async function searchMaterials(keyword: string): Promise<MaterialItem[]> {
  const materials = await listMaterials()
  const lowerKeyword = keyword.toLowerCase()
  return materials.filter(m => 
    m.title.toLowerCase().includes(lowerKeyword) ||
    m.content.toLowerCase().includes(lowerKeyword) ||
    m.tags?.some(tag => tag.toLowerCase().includes(lowerKeyword))
  )
}
