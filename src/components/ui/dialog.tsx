import * as React from "react";
import { cn } from "@/lib/utils";

const Dialog = ({ children, open, onOpenChange }: { 
  children: React.ReactNode; 
  open?: boolean; 
  onOpenChange?: (open: boolean) => void; 
}) => {
  const [isOpen, setIsOpen] = React.useState(open || false);
  
  React.useEffect(() => {
    if (open !== undefined) setIsOpen(open);
  }, [open]);
  
  const handleClose = () => {
    const newState = false;
    setIsOpen(newState);
    onOpenChange?.(newState);
  };
  
  return (
    <>
      {children}
    </>
  );
};

const DialogTrigger = ({ children, asChild, ...props }: { 
  children: React.ReactNode; 
  asChild?: boolean;
  onClick?: () => void; 
}) => (
  <div {...props}>
    {children}
  </div>
);

const DialogContent = ({ 
  children, 
  className, 
  onClose, 
  ...props 
}: { 
  children: React.ReactNode; 
  className?: string; 
  onClose?: () => void; 
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="fixed inset-0 bg-black/80" onClick={onClose} />
    <div
      className={cn(
        "relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg",
        className
      )}
      {...props}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
      >
        ✕
      </button>
      {children}
    </div>
  </div>
);

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);

const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
);

const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props} />
);

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription };