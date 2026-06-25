import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const webhookSecret = request.headers.get('x-webhook-secret')

  if (webhookSecret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
  }

  const body = await request.json()
  const adminSupabase = createAdminClient()

  const updateData: any = {}

  if (body.status) {
    updateData.status = body.status
  }

  if (body.status === 'running' && !body.started_at) {
    updateData.started_at = new Date().toISOString()
  }

  if (body.status === 'completed' || body.status === 'failed') {
    updateData.completed_at = new Date().toISOString()
  }

  if (body.total_items !== undefined) {
    updateData.total_items = body.total_items
  }

  if (body.processed_urls !== undefined) {
    updateData.processed_urls = body.processed_urls
  }

  if (body.error_message) {
    updateData.error_message = body.error_message
  }

  const { error } = await adminSupabase
    .from('scrape_jobs')
    .update(updateData)
    .eq('id', body.job_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
