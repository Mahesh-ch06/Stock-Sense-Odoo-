import * as React from 'react';

export function PageHeader({ title, description, actions, children }) {
  const actionSlot = actions || children;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800/80 mb-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-zinc-400">
            {description}
          </p>
        )}
      </div>
      {actionSlot && (
        <div className="flex items-center gap-3 flex-wrap self-start sm:self-auto">
          {actionSlot}
        </div>
      )}
    </div>
  );
}
