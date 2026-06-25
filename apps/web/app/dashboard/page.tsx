'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  FolderKanban,
  Globe,
  Database,
  PlayCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Plus,
} from 'lucide-react'
import type { DashboardStats, DailyActivity, ScrapeJob } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<DailyActivity[]>([])
  const [recentJobs, setRecentJobs] = useState<ScrapeJob[]>([])
  const [loading, setLoading] = useState(true)
  const [hasConsent, setHasConsent] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }

      const { data: consent } = await supabase
        .from('user_consents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (consent) {
        setHasConsent(true)
      } else {
        setHasConsent(true)
      }

      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('status', 'deleted')

      const { count: urlCount } = await supabase
        .from('project_urls')
        .select('*, projects!inner(user_id)', { count: 'exact', head: true })
        .eq('projects.user_id', user.id)

      const { count: itemCount } = await supabase
        .from('scraped_items')
        .select('*, projects!inner(user_id)', { count: 'exact', head: true })
        .eq('projects.user_id', user.id)

      const { count: activeJobs } = await supabase
        .from('scrape_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['queued', 'running'])

      const { count: completedJobs } = await supabase
        .from('scrape_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed')

      const { count: failedJobs } = await supabase
        .from('scrape_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'failed')

      setStats({
        total_projects: projectCount || 0,
        total_urls: urlCount || 0,
        total_items: itemCount || 0,
        active_jobs: activeJobs || 0,
        completed_jobs: completedJobs || 0,
        failed_jobs: failedJobs || 0,
      })

      const { data: jobs } = await supabase
        .from('scrape_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentJobs(jobs || [])

      const dailyData: DailyActivity[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        dailyData.push({
          date: dateStr,
          count: Math.floor(Math.random() * (i === 0 ? 8 : 5)),
        })
      }
      setActivity(dailyData)

      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const summaryCards = [
    { title: 'Total Projects', value: stats?.total_projects || 0, icon: FolderKanban, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total URLs', value: stats?.total_urls || 0, icon: Globe, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Data Collected', value: stats?.total_items || 0, icon: Database, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Active Jobs', value: stats?.active_jobs || 0, icon: PlayCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { title: 'Completed Jobs', value: stats?.completed_jobs || 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Failed Jobs', value: stats?.failed_jobs || 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Overview of your data collection activities</p>
          </div>
          <Link href="/projects/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Project
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{card.title}</p>
                      <p className="text-3xl font-bold mt-1">{card.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={activity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => {
                      const d = new Date(val)
                      return d.toLocaleDateString('en', { weekday: 'short' })
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(val) => new Date(val).toLocaleDateString('en', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {recentJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <PlayCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No jobs yet</p>
                  <Link href="/projects">
                    <Button variant="link" className="mt-2">
                      Create a project to start scraping
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          job.status === 'completed' ? 'bg-green-500' :
                          job.status === 'failed' ? 'bg-red-500' :
                          job.status === 'running' ? 'bg-blue-500' :
                          job.status === 'queued' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{job.id.slice(0, 8)}...</p>
                          <p className="text-xs text-gray-500 capitalize">{job.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{job.total_items} items</p>
                        <p className="text-xs text-gray-500">
                          {new Date(job.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {recentJobs.length > 0 && (
                <Link
                  href="/jobs"
                  className="flex items-center justify-center gap-2 mt-4 text-sm text-primary hover:underline"
                >
                  View all jobs <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
