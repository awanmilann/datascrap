'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlayCircle, Clock, CheckCircle2, XCircle, Loader2, Ban } from 'lucide-react'
import { formatDate, formatNumber, JOB_STATUS_COLORS } from '@/lib/utils'
import type { ScrapeJob } from '@/types'

export default function JobsPage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      let query = supabase
        .from('scrape_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data } = await query
      setJobs(data || [])
      setLoading(false)
    })
  }, [statusFilter])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'running': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'rejected': return <Ban className="h-4 w-4 text-gray-500" />
      default: return <PlayCircle className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Active Jobs</h1>
            <p className="text-gray-500 mt-1">Monitor your running and queued scrape jobs</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Skeleton className="h-64" />
        ) : (
          <Card>
            <CardContent className="p-0">
              {jobs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <PlayCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No jobs found</p>
                  <p className="text-sm mt-1">Start a scrape job from a project</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>URLs</TableHead>
                      <TableHead>Items Collected</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => {
                      const duration = job.started_at && job.completed_at
                        ? Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)
                        : null

                      return (
                        <TableRow key={job.id}>
                          <TableCell className="font-mono text-sm">
                            {job.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(job.status)}
                              <Badge className={JOB_STATUS_COLORS[job.status]}>
                                {job.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{job.processed_urls}/{job.total_urls}</TableCell>
                          <TableCell className="font-medium">
                            {formatNumber(job.total_items)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(job.started_at || job.created_at)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {duration !== null ? `${duration}s` : '-'}
                          </TableCell>
                          <TableCell>
                            <Link href={`/jobs/${job.id}`}>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
