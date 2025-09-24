import React from "react";
import {
  Cross2Icon,
  CheckIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  DotFilledIcon,
} from "@radix-ui/react-icons";

// Map common lucide-like names to Radix icons or lightweight SVGs

export const X = Cross2Icon;
export const Check = CheckIcon;
export const ChevronRight = ChevronRightIcon;
export const ChevronDown = ChevronDownIcon;
export const ChevronLeft = ChevronLeftIcon;
export const ChevronUp = ChevronUpIcon;
export const Dot = DotFilledIcon;

// Simple inline SVG icons for items not in Radix set
export const Circle: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export const MoreHorizontal: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

export const ArrowLeft: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

export const ArrowRight: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
);

export const PanelLeft: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </svg>
);

export const Search: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

export const GripVertical: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
    <circle cx="9" cy="6" r="1" />
    <circle cx="15" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="18" r="1" />
  </svg>
);

export const FolderOpen: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M3 7h5l2 2h11v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

export const Upload: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M12 3v12" />
    <path d="M7 8l5-5 5 5" />
    <path d="M5 21h14" />
  </svg>
);

export const Download: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M12 21V9" />
    <path d="M17 14l-5 5-5-5" />
    <path d="M5 3h14" />
  </svg>
);

export const Eye: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const Trash2: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <rect x="6" y="6" width="12" height="14" rx="2" />
  </svg>
);

export const Plus: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export const FileText: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

export const Image: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

export const File: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </svg>
);

export const DollarSign: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M12 1v22" />
    <path d="M17 5a4 4 0 0 0-4-2H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6h-4a4 4 0 0 1-4-2" />
  </svg>
);

export const TrendingUp: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M3 17l6-6 4 4 7-7" />
    <path d="M14 7h7v7" />
  </svg>
);

export const TrendingDown: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M21 7l-6 6-4-4-7 7" />
    <path d="M10 17H3v-7" />
  </svg>
);

export const AlertTriangle: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

export const Users: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const Sparkles: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
    <path d="M5 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" />
  </svg>
);

export const Mail: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M3 5h18v14H3z" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

export const Phone: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.1 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.61a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.47-1.14a2 2 0 0 1 2.11-.45c.84.29 1.71.5 2.61.62A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const MapPin: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M12 22s8-4.5 8-10a8 8 0 1 0-16 0c0 5.5 8 10 8 10z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const Calendar: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
  </svg>
);

export const Settings: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8.4 20a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 6.1 3.34l.06.06A1.65 1.65 0 0 0 8 3.73 1.65 1.65 0 0 0 9 2.22V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 .33 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 20.66 6.1l-.06.06c-.47.47-.61 1.17-.33 1.82.21.49.33 1.02.33 1.57s-.12 1.08-.33 1.57z" />
  </svg>
);

export const Save: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <path d="M17 21V8H7v13" />
    <path d="M7 3v5h8" />
  </svg>
);

export const Palette: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M12 3a9 9 0 1 0 0 18c1.66 0 3-1.34 3-3 0-1.1.9-2 2-2h1a2 2 0 0 0 0-4h-1a2 2 0 0 1-2-2c0-1.66-1.34-3-3-3z" />
    <circle cx="6.5" cy="12.5" r="1.5" />
    <circle cx="9.5" cy="7.5" r="1.5" />
    <circle cx="14.5" cy="7.5" r="1.5" />
    <circle cx="17.5" cy="12.5" r="1.5" />
  </svg>
);

export const Volume2: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M11 5l-6 4H2v6h3l6 4z" />
    <path d="M19 5a7 7 0 0 1 0 14" />
    <path d="M16 8a4 4 0 0 1 0 8" />
  </svg>
);

export const Bell: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </svg>
);

export const Monitor: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8" />
  </svg>
);

export const Sun: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l-1.5-1.5M20.5 20.5L19 19M5 19l-1.5 1.5M20.5 3.5L19 5" />
  </svg>
);

export const Moon: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const Zap: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
  </svg>
);

export const Music: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

export const Play: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
    <path d="M8 5v14l11-7z" />
  </svg>
);

export const Pause: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

export const RefreshCw: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M23 4v6h-6" />
    <path d="M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
  </svg>
);

export const Clock: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export const Star: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
  </svg>
);

export const Ruler: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M3 17l14-14 4 4L7 21z" />
    <path d="M14 3l7 7" />
    <path d="M6 15l2 2" />
    <path d="M10 11l2 2" />
  </svg>
);

export const ShoppingCart: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

export const Camera: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export const Edit: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

export const User: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <circle cx="12" cy="7" r="4" />
    <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
  </svg>
);

export const Building: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 22V12h6v10" />
  </svg>
);

export const Truck: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <rect x="1" y="3" width="15" height="13" />
    <path d="M16 8h4l3 3v5h-4" />
    <circle cx="5.5" cy="19.5" r="2.5" />
    <circle cx="18.5" cy="19.5" r="2.5" />
  </svg>
);

export const Calculator: React.FC<React.ComponentProps<"svg"> & { className?: string }> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} {...props}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M8 6h8" />
    <path d="M8 10h8" />
    <path d="M8 14h8" />
    <path d="M8 18h8" />
  </svg>
);

