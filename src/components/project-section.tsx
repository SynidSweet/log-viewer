'use client'

import { useState } from 'react'
import { CreateProject } from '@/components/create-project'
import { ProjectSelector } from '@/components/project-selector'

export function ProjectSection() {
  const [refreshKey, setRefreshKey] = useState(0)
  
  const handleProjectCreated = () => {
    // Force refresh the ProjectSelector when a new project is created
    setRefreshKey(prev => prev + 1)
  }
  
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      <h2 className="text-xl font-semibold">Projects</h2>
      <ProjectSelector key={refreshKey} />
      <CreateProject onProjectCreated={handleProjectCreated} />
    </div>
  )
} 