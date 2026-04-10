import { supabase } from '../lib/supabase'

// 获取当前用户 ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('未登录')
  }
  return user.id
}

export async function getSetting(key: string): Promise<any> {
  const userId = await getCurrentUserId()
  
  const { data: setting, error } = await supabase
    .from('settings')
    .select('value')
    .eq('user_id', userId)
    .eq('key', key)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // 没有找到记录
      return null
    }
    throw new Error(error.message)
  }
  
  return setting?.value
}

export async function setSetting(key: string, value: any): Promise<void> {
  const userId = await getCurrentUserId()
  
  const { error } = await supabase
    .from('settings')
    .upsert({
      user_id: userId,
      key,
      value,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,key'
    })
  
  if (error) {
    throw new Error(error.message)
  }
}

export async function getAllSettings(): Promise<Record<string, any>> {
  const userId = await getCurrentUserId()
  
  const { data: settings, error } = await supabase
    .from('settings')
    .select('key, value')
    .eq('user_id', userId)
  
  if (error) {
    throw new Error(error.message)
  }
  
  const result: Record<string, any> = {}
  settings?.forEach((setting: any) => {
    result[setting.key] = setting.value
  })
  
  return result
}

export async function deleteSetting(key: string): Promise<void> {
  const userId = await getCurrentUserId()
  
  const { error } = await supabase
    .from('settings')
    .delete()
    .eq('user_id', userId)
    .eq('key', key)
  
  if (error) {
    throw new Error(error.message)
  }
}

// 导出数据为 JSON
export async function exportData(): Promise<string> {
  const userId = await getCurrentUserId()
  
  // 获取所有相关数据
  const [tasks, notes, inbox, tags, settings] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', userId),
    supabase.from('notes').select('*').eq('user_id', userId),
    supabase.from('inbox').select('*').eq('user_id', userId),
    supabase.from('tags').select('*').eq('user_id', userId),
    supabase.from('settings').select('*').eq('user_id', userId)
  ])
  
  const exportData = {
    export_date: new Date().toISOString(),
    tasks: tasks.data || [],
    notes: notes.data || [],
    inbox: inbox.data || [],
    tags: tags.data || [],
    settings: settings.data || []
  }
  
  return JSON.stringify(exportData, null, 2)
}

// 下载导出文件
export async function downloadExport(): Promise<void> {
  const data = await exportData()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `todo_export_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}
