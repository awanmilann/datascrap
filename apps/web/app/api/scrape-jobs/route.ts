import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function processJobInline(jobId: string, projectId: string, userId: string, urls: string[]) {
  const adminSupabase = createAdminClient()

  await adminSupabase
    .from('scrape_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', jobId)

  let totalItems = 0
  let processedUrls = 0

  for (const url of urls) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'DataHarvest/1.0 (Research Bot)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      })
      clearTimeout(timeout)

      if (!response.ok) {
        await adminSupabase.from('error_logs').insert({
          scrape_job_id: jobId,
          project_id: projectId,
          url,
          error_code: `HTTP_${response.status}`,
          error_message: `HTTP ${response.status}`,
        })
        processedUrls++
        continue
      }

      const html = await response.text()
      const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] || ''
      const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i)?.[1]
      const desc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i)?.[1]
      const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i)?.[1]
      const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i)?.[1]
      const ogPrice = html.match(/(?:Rp|IDR|Rp\.?)\s*([\d,]+(?:\.\d{3})*)/i)?.[1]

      await adminSupabase.from('scraped_items').insert({
        project_id: projectId,
        scrape_job_id: jobId,
        title: ogTitle || title || new URL(url).hostname,
        price: ogPrice ? `Rp ${ogPrice}` : null,
        description: ogDesc || desc || null,
        image_url: ogImage || null,
        source_url: url,
        scraped_at: new Date().toISOString(),
        raw_data: { url, length: html.length },
      })

      totalItems++
    } catch (err: any) {
      await adminSupabase.from('error_logs').insert({
        scrape_job_id: jobId,
        project_id: projectId,
        url,
        error_code: 'FETCH_ERROR',
        error_message: err?.message || 'Failed to fetch',
      })
    }
    processedUrls++
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  await adminSupabase
    .from('scrape_jobs')
    .update({
      status: 'completed',
      processed_urls: processedUrls,
      total_items: totalItems,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)

  await adminSupabase.from('audit_logs').insert({
    user_id: userId,
    action: 'scrape_job.completed',
    entity_type: 'scrape_job',
    entity_id: jobId,
  })
}

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
  } else {
    processJobInline(job.id, body.project_id, user.id, urls.map(u => u.url))
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
