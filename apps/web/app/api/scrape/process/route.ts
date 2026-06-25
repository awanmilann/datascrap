import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const adminSupabase = createAdminClient()

  const { data: queuedJobs } = await adminSupabase
    .from('scrape_jobs')
    .select('*')
    .eq('status', 'queued')
    .limit(1)

  if (!queuedJobs || queuedJobs.length === 0) {
    return NextResponse.json({ message: 'No queued jobs' })
  }

  const job = queuedJobs[0]

  await adminSupabase
    .from('scrape_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', job.id)

  const { data: urls } = await adminSupabase
    .from('project_urls')
    .select('url')
    .eq('project_id', job.project_id)
    .eq('is_active', true)

  if (!urls || urls.length === 0) {
    await adminSupabase
      .from('scrape_jobs')
      .update({ status: 'failed', error_message: 'No URLs to scrape', completed_at: new Date().toISOString() })
      .eq('id', job.id)
    return NextResponse.json({ message: 'No URLs' })
  }

  let totalItems = 0
  let processedUrls = 0

  for (const urlObj of urls) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(urlObj.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'DataHarvest/1.0 (Research Bot)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      })
      clearTimeout(timeout)

      if (!response.ok) {
        await adminSupabase.from('error_logs').insert({
          scrape_job_id: job.id,
          project_id: job.project_id,
          url: urlObj.url,
          error_code: `HTTP_${response.status}`,
          error_message: `HTTP ${response.status}: ${response.statusText}`,
        })
        processedUrls++
        continue
      }

      const html = await response.text()
      const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]
      const desc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i)?.[1]
      const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i)?.[1]
      const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i)?.[1]

      await adminSupabase.from('scraped_items').insert({
        project_id: job.project_id,
        scrape_job_id: job.id,
        title: ogTitle || title || urlObj.url,
        description: desc || null,
        image_url: ogImage || null,
        source_url: urlObj.url,
        scraped_at: new Date().toISOString(),
        raw_data: { html_length: html.length },
      })

      totalItems++

      const domain = new URL(urlObj.url).hostname
      await new Promise(resolve => setTimeout(resolve, 3000))
    } catch (err: any) {
      await adminSupabase.from('error_logs').insert({
        scrape_job_id: job.id,
        project_id: job.project_id,
        url: urlObj.url,
        error_code: 'FETCH_ERROR',
        error_message: err.message || 'Failed to fetch URL',
      })
    }
    processedUrls++
  }

  await adminSupabase
    .from('scrape_jobs')
    .update({
      status: 'completed',
      processed_urls: processedUrls,
      total_items: totalItems,
      completed_at: new Date().toISOString(),
    })
    .eq('id', job.id)

  await adminSupabase.from('audit_logs').insert({
    user_id: job.user_id,
    action: 'scrape_job.completed',
    entity_type: 'scrape_job',
    entity_id: job.id,
  })

  return NextResponse.json({
    message: 'Job processed',
    job_id: job.id,
    items: totalItems,
    urls: processedUrls,
  })
}
