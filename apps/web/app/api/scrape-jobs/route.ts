import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const { data: activeJobs } = await supabase
    .from('scrape_jobs')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['queued', 'running'])

  if (activeJobs && activeJobs.length > 0) {
    return NextResponse.json({ error: 'Active job already exists' }, { status: 429 })
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', body.project_id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const { data: urls } = await supabase
    .from('project_urls')
    .select('url')
    .eq('project_id', body.project_id)
    .eq('is_active', true)

  if (!urls || urls.length === 0) {
    return NextResponse.json({ error: 'No active URLs in project' }, { status: 400 })
  }

  const { data: job, error } = await supabase
    .from('scrape_jobs')
    .insert({
      project_id: body.project_id,
      user_id: user.id,
      status: 'queued',
      total_urls: urls.length,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'scrape_job.created',
    entity_type: 'scrape_job',
    entity_id: job.id,
  })

  if (process.env.SCRAPER_API_URL) {
    try {
      await fetch(`${process.env.SCRAPER_API_URL}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.SCRAPER_INTERNAL_API_KEY || '',
        },
        body: JSON.stringify({
          project_id: body.project_id,
          job_id: job.id,
          urls: urls.map(u => u.url),
          fields: body.fields || ['title', 'price', 'description'],
          custom_selector: body.custom_selector || null,
        }),
      })
    } catch (e) {
      console.error('Failed to notify scraper worker:', e)
    }
  }

  return NextResponse.json(job, { status: 201 })
}

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('scrape_jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
