import Link from 'next/link';
import { Store, History } from 'lucide-react';

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* POS Sub-Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">POS Terminal</h1>
          <p className="text-sm text-gray-500">Manage offline sales and walk-in customers</p>
        </div>
        
        {/* Toggle Buttons */}
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          <Link 
            href="/admin/pos" 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-gray-50 rounded-md transition-colors text-gray-700"
          >
            <Store size={16} />
            Terminal
          </Link>
          <div className="w-px bg-gray-200 my-1 mx-1"></div>
          <Link 
            href="/admin/pos/history" 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-gray-50 rounded-md transition-colors text-gray-700"
          >
            <History size={16} />
            History
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}