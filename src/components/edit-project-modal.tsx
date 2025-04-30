'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Project } from '@/lib/types'
import { toast } from 'sonner'
import { CopyIcon, CheckIcon, EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons'

interface EditProjectModalProps {
  project: Project
  onProjectUpdated: () => void
  trigger: React.ReactNode
}

export function EditProjectModal({ project, onProjectUpdated, trigger }: EditProjectModalProps) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasLogs, setHasLogs] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    id: ''
  })

  useEffect(() => {
    if (open && project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        id: project.id
      })
      
      // Check if project has logs
      const checkProjectLogs = async () => {
        try {
          const response = await fetch(`/api/projects/${project.id}/logs/check`)
          if (response.ok) {
            const data = await response.json()
            setHasLogs(data.hasLogs)
          }
        } catch (error) {
          console.error('Failed to check if project has logs', error)
        }
      }
      
      checkProjectLogs()
    }
  }, [open, project])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update project')
      }
      
      toast.success('Project updated', {
        description: `Project "${data.name}" updated successfully`
      })
      
      setOpen(false)
      onProjectUpdated()
    } catch (error) {
      toast.error('Error', {
        description: (error as Error).message || 'Failed to update project'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete project')
      }
      
      toast.success('Project deleted', {
        description: `Project "${project.name}" has been deleted`
      })
      
      setOpen(false)
      onProjectUpdated()
    } catch (error) {
      toast.error('Error', {
        description: (error as Error).message || 'Failed to delete project'
      })
    } finally {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  const copyApiKey = async () => {
    if (project.apiKey) {
      await navigator.clipboard.writeText(project.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('API key copied to clipboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="name">Project Name</label>
            <Input 
              id="name"
              name="name"
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description">Description</label>
            <Textarea 
              id="description"
              name="description"
              value={formData.description} 
              onChange={handleChange} 
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="id">Project ID</label>
            <div className="flex items-center gap-2">
              <Input 
                id="id"
                name="id"
                value={formData.id} 
                onChange={handleChange}
                required
                disabled={hasLogs}
              />
              {hasLogs && (
                <div className="text-xs text-amber-600">
                  Cannot change ID after logs have been received
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="apiKey">API Key</label>
            <div className="flex items-center gap-2">
              <Input 
                id="apiKey"
                value={project.apiKey} 
                readOnly
                type={showApiKey ? "text" : "password"}
                className="font-mono"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={() => setShowApiKey(!showApiKey)}
                title={showApiKey ? "Hide API Key" : "Show API Key"}
              >
                {showApiKey ? <EyeClosedIcon className="h-4 w-4" /> : <EyeOpenIcon className="h-4 w-4" />}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={copyApiKey}
                title="Copy API Key"
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">This API key is required to send logs to this project</p>
          </div>
          
          <div className="pt-2 grid grid-cols-2 gap-2">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
            
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {confirmDelete 
                ? (isDeleting ? 'Deleting...' : 'Confirm Delete') 
                : (hasLogs ? 'Delete (Has Logs)' : 'Delete Project')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 