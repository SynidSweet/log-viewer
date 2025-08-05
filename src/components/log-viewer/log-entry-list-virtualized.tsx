'use client'

import { useMemo, memo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import { format } from 'date-fns'
import { LogEntry } from './log-entry-details'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

interface LogEntryListProps {
  entries: LogEntry[];
  selectedIndex: number;
  onSelectEntry: (index: number) => void;
  selectedEntryIds: Set<string>;
  onToggleSelection: (entryId: string, shiftKey?: boolean) => void;
}

// Calculate item height based on styling:
// - py-1.5 (top/bottom 6px each = 12px)
// - Checkbox + timestamp line: ~16px
// - Message text (2 lines max with line-clamp-2): ~32px (16px * 2)
// - Padding and spacing: ~8px
// Total estimated: ~68px per item
const ITEM_HEIGHT = 68;

interface VirtualizedItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    entries: LogEntry[];
    selectedIndex: number;
    onSelectEntry: (index: number) => void;
    selectedEntryIds: Set<string>;
    onToggleSelection: (entryId: string, shiftKey?: boolean) => void;
    formattedTimestamps: string[];
  };
}

// Memoized item renderer for react-window
const VirtualizedItem = memo(({ index, style, data }: VirtualizedItemProps) => {
  const { entries, selectedIndex, onSelectEntry, selectedEntryIds, onToggleSelection, formattedTimestamps } = data;
  const entry = entries[index];

  const handleClick = useCallback(() => {
    onSelectEntry(index);
  }, [onSelectEntry, index]);

  const handleCheckboxChange = useCallback(() => {
    // Get the current shift key state from the event
    const event = window.event as MouseEvent | KeyboardEvent | null;
    const shiftKey = event?.shiftKey || false;
    onToggleSelection(entry.id, shiftKey);
  }, [onToggleSelection, entry.id]);

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      style={style}
      className={`py-1.5 px-2 cursor-pointer hover:bg-gray-50 relative border-b border-gray-200 ${
        index === selectedIndex ? 'bg-blue-100 border-l-4 border-l-blue-500 shadow-sm' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center mb-1">
        <Checkbox
          checked={selectedEntryIds.has(entry.id)}
          onCheckedChange={handleCheckboxChange}
          className="mr-2 h-3 w-3"
          onClick={handleCheckboxClick}
        />
        <span 
          className={`text-[10px] px-1 py-0.5 rounded text-white font-medium mr-1.5 ${
            entry.level === 'ERROR' ? 'bg-red-500' : 
            entry.level === 'WARN' ? 'bg-yellow-500' : 
            entry.level === 'DEBUG' ? 'bg-purple-500' : 
            entry.level === 'INFO' ? 'bg-blue-500' : 'bg-green-500'
          }`}
        >
          {entry.level}
        </span>
        <span className="text-[10px] text-gray-500">
          {formattedTimestamps[index]}
        </span>
      </div>
      
      <div className="text-sm font-medium line-clamp-2 pr-2">
        {entry.message}
      </div>
      
      {/* Tags badges in top-right corner */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="absolute top-1.5 right-1.5 flex flex-wrap gap-1 max-w-[40%]">
          {entry.tags.slice(0, 2).map((tag, tagIndex) => (
            <Badge 
              key={tagIndex}
              variant="secondary" 
              className="text-[8px] px-1 py-0 h-4 bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              {tag}
            </Badge>
          ))}
          {entry.tags.length > 2 && (
            <Badge 
              variant="secondary" 
              className="text-[8px] px-1 py-0 h-4 bg-gray-300 text-gray-600"
              title={`Additional tags: ${entry.tags.slice(2).join(', ')}`}
            >
              +{entry.tags.length - 2}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
});

VirtualizedItem.displayName = 'VirtualizedItem';

function LogEntryListVirtualizedComponent({ entries, selectedIndex, onSelectEntry, selectedEntryIds, onToggleSelection }: LogEntryListProps) {
  // Memoize formatted timestamps to avoid re-formatting on every render
  const formattedTimestamps = useMemo(() => {
    return entries.map(entry => format(new Date(entry.timestamp), 'HH:mm:ss'))
  }, [entries]);

  // Memoize item data to avoid unnecessary re-renders
  const itemData = useMemo(() => ({
    entries,
    selectedIndex,
    onSelectEntry,
    selectedEntryIds,
    onToggleSelection,
    formattedTimestamps,
  }), [entries, selectedIndex, onSelectEntry, selectedEntryIds, onToggleSelection, formattedTimestamps]);

  // Scroll to selected item when selectedIndex changes
  const listRef = useCallback((list: List | null) => {
    if (list && selectedIndex >= 0) {
      list.scrollToItem(selectedIndex, 'smart');
    }
  }, [selectedIndex]);

  return (
    <List
      ref={listRef}
      height={400} // Will be overridden by parent container
      itemCount={entries.length}
      itemSize={ITEM_HEIGHT}
      itemData={itemData}
      width="100%"
      style={{ height: '100%' }}
    >
      {VirtualizedItem}
    </List>
  );
}

// Custom comparison function for React.memo - same as original
function arePropsEqual(prevProps: LogEntryListProps, nextProps: LogEntryListProps): boolean {
  // Check if entries array length or references have changed
  if (prevProps.entries.length !== nextProps.entries.length) {
    return false
  }
  
  // Check if any entry in the array has changed (shallow comparison)
  for (let i = 0; i < prevProps.entries.length; i++) {
    if (prevProps.entries[i] !== nextProps.entries[i]) {
      return false
    }
  }
  
  // Check if selectedIndex has changed
  if (prevProps.selectedIndex !== nextProps.selectedIndex) {
    return false
  }
  
  // Check if selectedEntryIds Set has changed by comparing size and contents
  if (prevProps.selectedEntryIds.size !== nextProps.selectedEntryIds.size) {
    return false
  }
  
  // Compare Set contents - if sizes are equal, check if all items match
  for (const id of prevProps.selectedEntryIds) {
    if (!nextProps.selectedEntryIds.has(id)) {
      return false
    }
  }
  
  return true
}

// Export the memoized virtualized component
export const LogEntryListVirtualized = memo(LogEntryListVirtualizedComponent, arePropsEqual)