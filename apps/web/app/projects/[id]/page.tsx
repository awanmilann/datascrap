'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Play,
  Trash2,
  ExternalLink,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Copy,
} from 'lucide-react'
import { formatDate, formatNumber, JOB_STATUS_COLORS, DATA_TYPE_LABELS } from '@/lib/utils'
import type { Project, ProjectUrl, ScrapeJob, ScrapedItem } from '@/types'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [urls, setUrls] = useState<ProjectUrl[]>([])
  const [jobs, setJobs] = useState<ScrapeJob[]>([])
  const [items, setItems] = useState<ScrapedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [startingJob, setStartingJob] = useState(false)

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: projectData } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!projectData) {
      router.push('/projects')
      return
    }
    setProject(projectData)

    const { data: urlsData } = await supabase
      .from('project_urls')
      .select('*')
      .eq('project_id', params.id)

    setUrls(urlsData || [])

    const { data: jobsData } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('project_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10)

    setJobs(jobsData || [])

    const { data: itemsData } = await supabase
      .from('scraped_items')
      .select('*')
      .eq('project_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setItems(itemsData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [params.id])

  const handleStartScraping = async () => {
    setStartingJob(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: activeJobs } = await supabase
      .from('scrape_jobs')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['queued', 'running'])

    if (activeJobs && activeJobs.length > 0) {
      alert('You already have an active job. Please wait for it to complete.')
      setStartingJob(false)
      return
    }

    const { data: job, error } = await supabase
      .from('scrape_jobs')
      .insert({
        project_id: params.id,
        user_id: user.id,
        status: 'queued',
        total_urls: urls.length,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      setStartingJob(false)
      return
    }

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'scrape_job.created',
      entity_type: 'scrape_job',
      entity_id: job.id,
      domain: urls[0]?.domain,
    })

    setStartingJob(false)
    fetchData()
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-48 mb-6" />
        <Skeleton className="h-64" />
      </DashboardLayout>
    )
  }

  if (!project) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <Badge>{DATA_TYPE_LABELS[project.data_type]}</Badge>
                <Badge variant={project.status === 'active' ? 'default' : 'outline'}>
                  {project.status}
                </Badge>
              </div>
              <p className="text-gray-500 mt-1">{project.description || 'No description'}</p>
            </div>
          </div>
          <Button onClick={handleStartScraping} disabled={startingJob || urls.length === 0} className="gap-2">
            {startingJob ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {startingJob ? 'Starting...' : 'Start Scraping'}
          </Button>
        </div>

        <Tabs defaultValue="data">
          <TabsList>
            <TabsTrigger value="data">Data ({items.length})</TabsTrigger>
            <TabsTrigger value="urls">URLs ({urls.length})</TabsTrigger>
            <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Scraped Data</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Globe className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No data collected yet</p>
                    <p className="text-sm mt-1">Click "Start Scraping" to begin collecting data</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Source URL</TableHead>
                          <TableHead>Scraped At</TableHead>
                          <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {item.title || 'N/A'}
                            </TableCell>
                            <TableCell>{item.price || '-'}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              <a
                                href={item.source_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                {item.source_url?.slice(0, 30)}...
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDate(item.scraped_at)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopy(JSON.stringify(item.raw_data || item, null, 2))}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="urls">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Target URLs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {urls.map((url) => (
                    <div
                      key={url.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{url.url}</p>
                          <p className="text-xs text-gray-500">Domain: {url.domain}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {url.robots_allowed !== null && (
                          <Badge variant={url.robots_allowed ? 'default' : 'destructive'}>
                            {url.robots_allowed ? 'Robots OK' : 'Robots Blocked'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scrape Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No jobs yet</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>URLs</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobs.map((job) => (
                          <TableRow key={job.id}>
                            <TableCell className="font-mono text-sm">
                              {job.id.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <Badge className={JOB_STATUS_COLORS[job.status]}>
                                {job.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{job.processed_urls}/{job.total_urls}</TableCell>
                            <TableCell>{formatNumber(job.total_items)}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDate(job.started_at || job.created_at)}
                            </TableCell>
                            <TableCell>
                              <Link href={`/jobs/${job.id}`}>
                                <Button variant="ghost" size="sm">
                                  View
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
