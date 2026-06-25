'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import { formatDate, formatNumber, JOB_STATUS_COLORS } from '@/lib/utils'
import type { ScrapeJob, ScrapedItem, ErrorLog } from '@/types'

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<ScrapeJob | null>(null)
  const [items, setItems] = useState<ScrapedItem[]>([])
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const { data: jobData } = await supabase
        .from('scrape_jobs')
        .select('*')
        .eq('id', params.id)
        .single()

      if (!jobData) {
        router.push('/jobs')
        return
      }
      setJob(jobData)

      const { data: itemsData } = await supabase
        .from('scraped_items')
        .select('*')
        .eq('scrape_job_id', params.id)
        .order('created_at', { ascending: false })
        .limit(100)

      setItems(itemsData || [])

      const { data: errorsData } = await supabase
        .from('error_logs')
        .select('*')
        .eq('scrape_job_id', params.id)
        .order('created_at', { ascending: false })

      setErrors(errorsData || [])
      setLoading(false)
    })
  }, [params.id, router])

  if (loading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </DashboardLayout>
    )
  }

  if (!job) return null

  const duration = job.started_at && job.completed_at
    ? Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)
    : null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/jobs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Job Details</h1>
              <Badge className={JOB_STATUS_COLORS[job.status]}>{job.status}</Badge>
            </div>
            <p className="text-gray-500 mt-1 font-mono text-sm">ID: {job.id}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Total URLs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{job.total_urls}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Processed URLs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{job.processed_urls}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Items Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatNumber(job.total_items)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{duration !== null ? `${duration}s` : '-'}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Created</span>
                <span>{formatDate(job.created_at)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Started</span>
                <span>{formatDate(job.started_at)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Completed</span>
                <span>{formatDate(job.completed_at)}</span>
              </div>
            </CardContent>
          </Card>

          {(job.error_message || job.rejection_reason) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">
                  {job.rejection_reason ? 'Rejection Reason' : 'Error Message'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg border border-red-200">
                  {job.rejection_reason || job.error_message}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {errors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Error Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {errors.map((err) => (
                  <div key={err.id} className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                    <p className="font-medium text-red-700">
                      {err.error_code && `[${err.error_code}] `}{err.error_message}
                    </p>
                    <p className="text-xs text-red-500 mt-1">{err.url}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(err.created_at)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scraped Items ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No items scraped in this job</p>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Title</th>
                      <th className="text-left p-3 font-medium">Price</th>
                      <th className="text-left p-3 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.slice(0, 20).map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-3 max-w-[200px] truncate">{item.title || 'N/A'}</td>
                        <td className="p-3">{item.price || '-'}</td>
                        <td className="p-3 max-w-[200px] truncate text-primary">{item.source_url}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
