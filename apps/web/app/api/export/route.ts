import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = createClient()
  const adminSupabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const { data: items } = await supabase
    .from('scraped_items')
    .select('*')
    .eq('project_id', body.project_id)
    .order('created_at', { ascending: false })

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No data to export' }, { status: 400 })
  }

  const headers = ['title', 'price', 'description', 'image_url', 'source_url', 'published_date', 'scraped_at']
  const csvRows = [headers.join(',')]

  for (const item of items) {
    const row = headers.map(h => {
      const val = (item as any)[h] || ''
      return `"${String(val).replace(/"/g, '""')}"`
    })
    csvRows.push(row.join(','))
  }

  const csvContent = csvRows.join('\n')
  const fileName = `dataharvest-export-${body.project_id.slice(0, 8)}-${Date.now()}.csv`
  const filePath = `exports/${user.id}/${fileName}`

  const { error: uploadError } = await adminSupabase.storage
    .from('exports')
    .upload(filePath, csvContent, {
      contentType: 'text/csv',
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = adminSupabase.storage
    .from('exports')
    .getPublicUrl(filePath)

  await supabase.from('export_logs').insert({
    project_id: body.project_id,
    user_id: user.id,
    file_name: fileName,
    file_path: urlData?.publicUrl || '',
    total_items: items.length,
  })

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'export.created',
    entity_type: 'export',
    entity_id: body.project_id,
  })

  return NextResponse.json({
    file_name: fileName,
    file_path: urlData?.publicUrl || '',
    total_items: items.length,
  })
}
