'use client';

import * as Icons from '@/components/icons';
import { useState } from 'react';

export default function TestIconsPage() {
  const [showLoader, setShowLoader] = useState(true);
  const [size, setSize] = useState(24);
  const [color, setColor] = useState('#000000');

  const iconList = [
    { name: 'Upload', icon: Icons.Upload },
    { name: 'Search', icon: Icons.Search },
    { name: 'X', icon: Icons.X },
    { name: 'ChevronDown', icon: Icons.ChevronDown },
    { name: 'ChevronRight', icon: Icons.ChevronRight },
    { name: 'ChevronUp', icon: Icons.ChevronUp },
    { name: 'Check', icon: Icons.Check },
    { name: 'CheckSquare', icon: Icons.CheckSquare },
    { name: 'Square', icon: Icons.Square },
    { name: 'Copy', icon: Icons.Copy },
    { name: 'Calendar', icon: Icons.Calendar },
    { name: 'AlertCircle', icon: Icons.AlertCircle },
    { name: 'Info', icon: Icons.Info },
    { name: 'Ban', icon: Icons.Ban },
    { name: 'Bug', icon: Icons.Bug },
    { name: 'Activity', icon: Icons.Activity },
    { name: 'Loader2 (animated)', icon: Icons.Loader2 },
    { name: 'Plus', icon: Icons.Plus },
    { name: 'Pencil', icon: Icons.Pencil },
    { name: 'Trash2', icon: Icons.Trash2 },
    { name: 'Eye', icon: Icons.Eye },
    { name: 'EyeOff', icon: Icons.EyeOff },
    { name: 'LogOut', icon: Icons.LogOut },
    { name: 'User', icon: Icons.User },
    { name: 'Key', icon: Icons.Key },
    { name: 'FileText', icon: Icons.FileText },
    { name: 'Filter', icon: Icons.Filter },
    { name: 'SortAsc', icon: Icons.SortAsc },
    { name: 'SortDesc', icon: Icons.SortDesc },
    { name: 'ArrowUp', icon: Icons.ArrowUp },
    { name: 'ArrowDown', icon: Icons.ArrowDown },
    { name: 'Clipboard', icon: Icons.Clipboard },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Icon Test Page</h1>
      
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Icon Size: {size}px</label>
          <input
            type="range"
            min="16"
            max="64"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-64"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Icon Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-32"
          />
        </div>
        
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showLoader}
              onChange={(e) => setShowLoader(e.target.checked)}
            />
            <span>Show animated loader</span>
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-6 gap-4">
        {iconList.map(({ name, icon: Icon }) => {
          if (name === 'Loader2 (animated)' && !showLoader) return null;
          
          return (
            <div key={name} className="border rounded p-4 text-center">
              <Icon size={size} color={color} className={name === 'Loader2 (animated)' ? 'mx-auto' : 'mx-auto'} />
              <p className="mt-2 text-xs">{name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}