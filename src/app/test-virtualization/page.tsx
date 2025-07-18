'use client'

import { useState, useMemo } from 'react'
import { LogEntryList } from '@/components/log-viewer/log-entry-list'
import { LogEntryListVirtualized } from '@/components/log-viewer/log-entry-list-virtualized'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Test log entry generator
function generateTestEntries(count: number) {
  const levels = ['LOG', 'ERROR', 'INFO', 'WARN', 'DEBUG'] as const;
  const entries = [];
  
  for (let i = 0; i < count; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const timestamp = new Date(Date.now() - (count - i) * 1000).toISOString();
    const message = `Test log entry ${i + 1} with some longer text to simulate real log messages that might wrap to multiple lines and test performance`;
    
    // Add some entries with tags
    const hasTags = i % 5 === 0;
    const hasExtendedData = i % 10 === 0;
    
    entries.push({
      id: `test_entry_${i}`,
      timestamp,
      level,
      message,
      details: hasExtendedData ? { 
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        sessionId: `session_${Math.floor(Math.random() * 100)}`,
        requestId: `req_${i}`,
        ...(hasTags ? { _tags: ['performance', 'test', `batch_${Math.floor(i / 100)}`] } : {})
      } : undefined,
      tags: hasTags ? ['performance', 'test', `batch_${Math.floor(i / 100)}`] : undefined,
      _timestampMs: new Date(timestamp).getTime(),
    });
  }
  
  return entries;
}

export default function VirtualizationTestPage() {
  const [useVirtualization, setUseVirtualization] = useState(false);
  const [entryCount, setEntryCount] = useState(1000);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
  const [renderTime, setRenderTime] = useState<number | null>(null);

  // Generate test entries
  const testEntries = useMemo(() => {
    const startTime = performance.now();
    const entries = generateTestEntries(entryCount);
    const endTime = performance.now();
    setRenderTime(endTime - startTime);
    return entries;
  }, [entryCount]);

  const handleSelectEntry = (index: number) => {
    setSelectedIndex(index);
  };

  const handleToggleSelection = (entryId: string) => {
    const newSet = new Set(selectedEntryIds);
    if (newSet.has(entryId)) {
      newSet.delete(entryId);
    } else {
      newSet.add(entryId);
    }
    setSelectedEntryIds(newSet);
  };

  const handleClearSelection = () => {
    setSelectedEntryIds(new Set());
  };

  const handleSelectAll = () => {
    setSelectedEntryIds(new Set(testEntries.map(entry => entry.id)));
  };

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Virtualization Performance Test</h1>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Mode:</label>
            <Button
              variant={useVirtualization ? "default" : "outline"}
              size="sm"
              onClick={() => setUseVirtualization(!useVirtualization)}
            >
              {useVirtualization ? "Virtualized" : "Standard"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Entries:</label>
            {[500, 1000, 2000, 5000, 10000].map(count => (
              <Button
                key={count}
                variant={entryCount === count ? "default" : "outline"}
                size="sm"
                onClick={() => setEntryCount(count)}
              >
                {count}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Selection:</label>
            <Button size="sm" variant="outline" onClick={handleClearSelection}>
              Clear ({selectedEntryIds.size})
            </Button>
            <Button size="sm" variant="outline" onClick={handleSelectAll}>
              Select All
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">
            Entries: {testEntries.length}
          </Badge>
          <Badge variant="secondary">
            Mode: {useVirtualization ? "Virtualized" : "Standard"}
          </Badge>
          <Badge variant="secondary">
            Selected: {selectedIndex + 1} / {testEntries.length}
          </Badge>
          <Badge variant="secondary">
            Multi-selected: {selectedEntryIds.size}
          </Badge>
          {renderTime && (
            <Badge variant="secondary">
              Generation: {renderTime.toFixed(2)}ms
            </Badge>
          )}
        </div>

        <div className="text-sm text-gray-600 mb-4">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside">
            <li>Toggle between Standard and Virtualized rendering modes</li>
            <li>Increase entry count to test performance with large datasets</li>
            <li>Click entries to select them, use checkboxes for multi-selection</li>
            <li>Monitor browser DevTools for performance differences</li>
            <li>Virtualized mode should maintain smooth scrolling even with 10,000+ entries</li>
          </ul>
        </div>
      </div>

      <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
        <div className="h-full overflow-y-auto">
          {useVirtualization ? (
            <LogEntryListVirtualized
              entries={testEntries}
              selectedIndex={selectedIndex}
              onSelectEntry={handleSelectEntry}
              selectedEntryIds={selectedEntryIds}
              onToggleSelection={handleToggleSelection}
            />
          ) : (
            <LogEntryList
              entries={testEntries}
              selectedIndex={selectedIndex}
              onSelectEntry={handleSelectEntry}
              selectedEntryIds={selectedEntryIds}
              onToggleSelection={handleToggleSelection}
            />
          )}
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          Performance tip: Open browser DevTools → Performance tab to measure render times
        </p>
      </div>
    </div>
  );
}