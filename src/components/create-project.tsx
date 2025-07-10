// components/create-project.tsx
// src/components/create-project.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { CopyIcon, CheckIcon, EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons'
import { Project } from '@/lib/types'

export function CreateProject({ onProjectCreated }: { onProjectCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newProject, setNewProject] = useState<Project | null>(null)
  const [copied, setCopied] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create project')
      }
      
      const result = await response.json()
      const project = result.success ? result.data : result
      toast.success('Project created', {
        description: `Project "${project.name}" created successfully with ID: ${project.id}`
      })
      
      setNewProject(project)
      onProjectCreated()
    } catch {
      toast.error('Error', {
        description: 'Failed to create project'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const copyApiKey = async () => {
    if (newProject?.apiKey) {
      await navigator.clipboard.writeText(newProject.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('API key copied to clipboard');
    }
  };

  const resetForm = () => {
    setName('')
    setDescription('')
    setNewProject(null)
    setOpen(false)
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      setOpen(value);
      if (!value) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">Create Project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{newProject ? 'Project Created' : 'Create a new project'}</DialogTitle>
        </DialogHeader>
        
        {newProject ? (
          <div className="space-y-4 mt-4">
            <div className="p-4 border rounded-md bg-muted/50">
              <p className="font-medium">Project created successfully</p>
              <p className="text-sm text-muted-foreground mb-2">Your project has been created with the following details:</p>
              
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Name:</p>
                  <p className="text-sm">{newProject.name}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">ID:</p>
                  <p className="text-sm">{newProject.id}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">API Key:</p>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={newProject.apiKey} 
                      readOnly
                      type={showApiKey ? "text" : "password"}
                      className="font-mono text-sm"
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Make sure to save this API key. You&apos;ll need it to authenticate log submissions.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="button" onClick={resetForm}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="name">Project Name</label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description">Description</label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Project'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}