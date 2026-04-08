export function exportData(): void {
  const link = document.createElement('a')
  link.href = 'http://localhost:8000/api/export?format=json'
  link.download = 'todo_export.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
