'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, Filter, ChevronDown, Copy, CheckSquare, Square } from '../icons'

export interface EntryFilters {
  searchText: string
  showLog: boolean
  showInfo: boolean
  showWarn: boolean
  showError: boolean
  showDebug: boolean
  selectedTags: string[]
}

interface LogEntryFiltersProps {
  entryFilters: EntryFilters
  onFiltersChange: (filters: EntryFilters) => void
  // Immediate search input for responsive UI
  searchInput: string
  onSearchInputChange: (value: string) => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: () => void
  availableTags: string[]
  selectedEntryIds: Set<string>
  filteredEntries: { id: string }[]
  onSelectAllEntries: () => void
  onClearAllSelections: () => void
  onCopySelectedEntries: () => void
}

export function LogEntryFilters({
  entryFilters,
  onFiltersChange,
  searchInput,
  onSearchInputChange,
  sortOrder,
  onSortOrderChange,
  availableTags,
  selectedEntryIds,
  filteredEntries,
  onSelectAllEntries,
  onClearAllSelections,
  onCopySelectedEntries
}: LogEntryFiltersProps) {
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [tagSearchTerm, setTagSearchTerm] = useState('')

  // Filter tags based on search term - optimized with early return and lowercase caching
  const filteredTags = useMemo(() => {
    if (!tagSearchTerm) return availableTags;
    
    const lowerSearchTerm = tagSearchTerm.toLowerCase();
    return availableTags.filter(tag => 
      tag.toLowerCase().includes(lowerSearchTerm)
    );
  }, [availableTags, tagSearchTerm]);

  // Tag filtering utility functions
  const toggleTag = useCallback((tag: string) => {
    onFiltersChange({
      ...entryFilters,
      selectedTags: entryFilters.selectedTags.includes(tag)
        ? entryFilters.selectedTags.filter(t => t !== tag)
        : [...entryFilters.selectedTags, tag]
    })
  }, [entryFilters, onFiltersChange])

  const selectAllTags = useCallback(() => {
    onFiltersChange({
      ...entryFilters,
      selectedTags: [...availableTags]
    })
  }, [entryFilters, onFiltersChange, availableTags])

  const clearAllTags = useCallback(() => {
    onFiltersChange({
      ...entryFilters,
      selectedTags: []
    })
    setTagSearchTerm('')
  }, [entryFilters, onFiltersChange])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownOpen && event.target instanceof Element) {
        const dropdown = document.getElementById('tag-dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
          setTagDropdownOpen(false);
          setTagSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tagDropdownOpen]);

  return (
    <div className="p-3 bg-gray-50 border-b border-gray-200 space-y-3 flex-shrink-0">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Filter entries..."
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          className="text-sm flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={onSortOrderChange}
          className="flex items-center space-x-1"
          title={`Sort by timestamp ${sortOrder === 'asc' ? 'ascending' : 'descending'} (Press 's' to toggle)`}
        >
          {sortOrder === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
        </Button>
      </div>
      
      {/* Copy Controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={selectedEntryIds.size === filteredEntries.length ? onClearAllSelections : onSelectAllEntries}
          className="flex items-center space-x-1 text-xs"
          disabled={filteredEntries.length === 0}
        >
          {selectedEntryIds.size === filteredEntries.length ? (
            <CheckSquare className="h-3 w-3" />
          ) : (
            <Square className="h-3 w-3" />
          )}
          <span>All</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onCopySelectedEntries}
          className="flex items-center space-x-1 text-xs"
          disabled={selectedEntryIds.size === 0}
        >
          <Copy className="h-3 w-3" />
          <span>Copy</span>
          {selectedEntryIds.size > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {selectedEntryIds.size}
            </Badge>
          )}
        </Button>
      </div>

      {/* Tags Filter Dropdown */}
      <div className="relative" id="tag-dropdown">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
          className="flex items-center space-x-2 text-xs"
          disabled={availableTags.length === 0}
        >
          <Filter className="h-3 w-3" />
          <span>Tags</span>
          {entryFilters.selectedTags.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {entryFilters.selectedTags.length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
        
        {tagDropdownOpen && availableTags.length > 0 && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200">
              <Input
                placeholder="Search tags..."
                value={tagSearchTerm}
                onChange={(e) => setTagSearchTerm(e.target.value)}
                className="text-xs h-7"
              />
            </div>
            
            {/* Actions */}
            <div className="p-2 border-b border-gray-200 flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllTags}
                className="text-xs h-6 px-2"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllTags}
                className="text-xs h-6 px-2"
              >
                Clear All
              </Button>
            </div>
            
            {/* Tags list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredTags.length === 0 ? (
                <div className="p-3 text-xs text-gray-500">
                  {tagSearchTerm ? 'No tags match your search' : 'No tags available'}
                </div>
              ) : (
                filteredTags.map(tag => (
                  <div key={tag} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={entryFilters.selectedTags.includes(tag)}
                      onCheckedChange={() => toggleTag(tag)}
                    />
                    <Label htmlFor={`tag-${tag}`} className="text-xs flex-1 cursor-pointer">
                      {tag}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Level Filter Checkboxes */}
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="show-log" 
            checked={entryFilters.showLog}
            onCheckedChange={(checked) => 
              onFiltersChange({ ...entryFilters, showLog: !!checked })
            }
          />
          <Label htmlFor="show-log" className="text-xs">LOG</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="show-info" 
            checked={entryFilters.showInfo}
            onCheckedChange={(checked) => 
              onFiltersChange({ ...entryFilters, showInfo: !!checked })
            }
          />
          <Label htmlFor="show-info" className="text-xs">INFO</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="show-warn" 
            checked={entryFilters.showWarn}
            onCheckedChange={(checked) => 
              onFiltersChange({ ...entryFilters, showWarn: !!checked })
            }
          />
          <Label htmlFor="show-warn" className="text-xs">WARN</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="show-error" 
            checked={entryFilters.showError}
            onCheckedChange={(checked) => 
              onFiltersChange({ ...entryFilters, showError: !!checked })
            }
          />
          <Label htmlFor="show-error" className="text-xs">ERROR</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="show-debug" 
            checked={entryFilters.showDebug}
            onCheckedChange={(checked) => 
              onFiltersChange({ ...entryFilters, showDebug: !!checked })
            }
          />
          <Label htmlFor="show-debug" className="text-xs">DEBUG</Label>
        </div>
      </div>
    </div>
  )
}