import * as React from "react";
import { MoreHorizontal, Download } from "lucide-react";

interface ChartActionsMenuProps {
  onDownloadCSV?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ChartActionsMenu({ 
  onDownloadCSV, 
  disabled = false,
  className = "" 
}: ChartActionsMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Handle click outside to close menu
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  const handleDownloadCSV = () => {
    onDownloadCSV?.();
    setIsMenuOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        disabled={disabled}
        aria-label="Chart options"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      
      {isMenuOpen && (
        <div className="absolute right-0 top-10 z-50 w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {onDownloadCSV && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleDownloadCSV}
              disabled={disabled}
            >
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </button>
          )}
          
          {/* Future actions can be added here */}
          {/* 
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
            onClick={() => console.log('Export PNG')}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Export PNG</span>
          </button>
          */}
        </div>
      )}
    </div>
  );
}