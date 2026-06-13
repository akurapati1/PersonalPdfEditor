import type { ReactNode } from 'react';

interface AppShellProps {
  header: ReactNode;
  sidebar: ReactNode;
  toolbar: ReactNode;
  children: ReactNode;
}

export function AppShell({ header, sidebar, toolbar, children }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex-none z-20">{header}</div>

      {/* Toolbar */}
      <div className="flex-none z-10">{toolbar}</div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex-none w-36 bg-gray-800 overflow-y-auto z-10">
          {sidebar}
        </div>

        {/* Main canvas area */}
        <div className="flex-1 overflow-auto bg-gray-300">{children}</div>
      </div>
    </div>
  );
}
