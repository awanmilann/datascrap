'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getDomainFromUrl, isValidUrl } from '@/lib/utils'

const DATA_TYPES = [
  { value: 'product', label: 'Product' },
  { value: 'article', label: 'Article' },
  { value: 'business', label: 'Business' },
  { value: 'custom', label: 'Custom' },
]

const FIELD_OPTIONS = [
  { value: 'title', label: 'Title' },
  { value: 'price', label: 'Price' },
  { value: 'description', label: 'Description' },
  { value: 'image_url', label: 'Image URL' },
  { value: 'source_url', label: 'Source URL' },
  { value: 'published_date', label: 'Published Date' },
]

const MAX_URLS = 20

export default function NewProjectPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dataType, setDataType] = useState('product')
  const [urls, setUrls] = useState<string[]>([''])
  const [selectedFields, setSelectedFields] = useState<string[]>(['title', 'price', 'description'])
  const [customSelector, setCustomSelector] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const addUrl = () => {
    if (urls.length < MAX_URLS) {
      setUrls([...urls, ''])
    }
  }

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index))
  }

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validUrls = urls.filter(u => u.trim())
    if (validUrls.length === 0) {
      setError('Please add at least one URL')
      return
    }

    for (const url of validUrls) {
      if (!isValidUrl(url)) {
        setError(`Invalid URL: ${url}`)
        return
      }
      const domain = getDomainFromUrl(url)
      if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(domain)) {
        setError(`Blocked domain: ${domain}`)
        return
      }
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        description,
        data_type: dataType,
      })
      .select()
      .single()

    if (projectError) {
      setError(projectError.message)
      setLoading(false)
      return
    }

    const urlInserts = validUrls.map(url => ({
      project_id: project.id,
      url,
      domain: getDomainFromUrl(url),
      is_active: true,
    }))

    const { error: urlsError } = await supabase
      .from('project_urls')
      .insert(urlInserts)

    if (urlsError) {
      setError(urlsError.message)
      setLoading(false)
      return
    }

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'project.created',
      entity_type: 'project',
      entity_id: project.id,
    })

    router.push(`/projects/${project.id}`)
  }

  const blockedDomains = ['localhost', '127.0.0.1', '0.0.0.0', '::1']

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
            <p className="text-gray-500 mt-1">Set up a new data collection project</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Basic information about your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Product Catalog"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What data are you collecting?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataType">Data Type</Label>
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>
                        {dt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target URLs</CardTitle>
              <CardDescription>
                Add up to {MAX_URLS} URLs to scrape. Only public URLs are allowed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {urls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      placeholder="https://example.com/products"
                      type="url"
                    />
                    {url && blockedDomains.includes(getDomainFromUrl(url)) && (
                      <p className="text-xs text-red-500 mt-1">This domain is blocked</p>
                    )}
                  </div>
                  {urls.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUrl(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {urls.length < MAX_URLS && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addUrl}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add URL
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fields to Collect</CardTitle>
              <CardDescription>Select the data fields you want to extract</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {FIELD_OPTIONS.map((field) => (
                  <Button
                    key={field.value}
                    type="button"
                    variant={selectedFields.includes(field.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleField(field.value)}
                  >
                    {field.label}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customSelector">
                  Custom CSS Selector (optional, for advanced users)
                </Label>
                <Input
                  id="customSelector"
                  value={customSelector}
                  onChange={(e) => setCustomSelector(e.target.value)}
                  placeholder="e.g., .product-title, #price"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href="/projects">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
