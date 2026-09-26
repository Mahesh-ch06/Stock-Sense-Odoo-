import * as React from 'react';

export function PageHeader({ title, description, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-zinc-400 mt-1">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}
