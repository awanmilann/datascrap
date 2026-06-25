'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  FolderKanban,
  PlayCircle,
  AlertTriangle,
  Globe,
  Shield,
} from 'lucide-react'
import { formatNumber, formatDate } from '@/lib/utils'
import type { AuditLog } from '@/types'

export default function AdminPage() {
  const [userCount, setUserCount] = useState(0)
  const [projectCount, setProjectCount] = useState(0)
  const [jobCount, setJobCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)

      const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const { count: pCount } = await supabase.from('projects').select('*', { count: 'exact', head: true })
      const { count: jCount } = await supabase.from('scrape_jobs').select('*', { count: 'exact', head: true })
      const { count: eCount } = await supabase.from('error_logs').select('*', { count: 'exact', head: true })

      setUserCount(uCount || 0)
      setProjectCount(pCount || 0)
      setJobCount(jCount || 0)
      setErrorCount(eCount || 0)

      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      setAuditLogs(logs || [])
      setLoading(false)
    })
  }, [router])

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

  if (!isAdmin) return null

  const stats = [
    { title: 'Total Users', value: userCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total Projects', value: projectCount, icon: FolderKanban, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Total Jobs', value: jobCount, icon: PlayCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Total Errors', value: errorCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 mt-1">System monitoring and management</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Tabs defaultValue="audit">
          <TabsList>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="domains">Top Domains</TabsTrigger>
          </TabsList>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {log.entity_type}:{log.entity_id?.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{log.domain || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(log.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domains">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Most Accessed Domains
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 text-center py-8">
                  Domain analytics will appear as data is collected.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
