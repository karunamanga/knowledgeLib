import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ResourceType, SubmissionStatus, LearningStatus } from '../../types';
import {
  FileText,
  FileCode,
  Video,
  Image as ImageIcon,
  Layers,
  Network,
  Link2,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] gap-1 font-medium',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-medium',
  };

  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60',
    primary: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60',
    secondary: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60',
    outline: 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-full leading-none shrink-0 transition-colors',
          sizeStyles[size],
          variantStyles[variant],
          className
        )
      )}
    >
      {children}
    </span>
  );
};

export const ResourceTypeBadge: React.FC<{ type: ResourceType; size?: 'sm' | 'md' }> = ({
  type,
  size = 'md',
}) => {
  const configs: Record<ResourceType, { label: string; icon: React.ReactNode; variant: BadgeProps['variant'] }> = {
    PRESENTATION: { label: 'Presentation', icon: <Layers className="w-3 h-3" />, variant: 'secondary' },
    PDF: { label: 'PDF Document', icon: <FileText className="w-3 h-3" />, variant: 'danger' },
    DOCUMENT: { label: 'Document', icon: <FileText className="w-3 h-3" />, variant: 'primary' },
    ARCHITECTURE: { label: 'Architecture', icon: <Network className="w-3 h-3" />, variant: 'warning' },
    VIDEO: { label: 'Video', icon: <Video className="w-3 h-3" />, variant: 'success' },
    IMAGE: { label: 'Image', icon: <ImageIcon className="w-3 h-3" />, variant: 'default' },
    DIAGRAM: { label: 'Diagram', icon: <FileCode className="w-3 h-3" />, variant: 'primary' },
    LINK: { label: 'External Link', icon: <Link2 className="w-3 h-3" />, variant: 'neutral' },
    OTHER: { label: 'Resource', icon: <Sparkles className="w-3 h-3" />, variant: 'neutral' },
  };

  const config = configs[type] || configs.OTHER;

  return (
    <Badge variant={config.variant} size={size}>
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
};

export const SubmissionStatusBadge: React.FC<{ status: SubmissionStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const configs: Record<SubmissionStatus, { label: string; icon: React.ReactNode; variant: BadgeProps['variant'] }> = {
    DRAFT: { label: 'Draft', icon: <Clock className="w-3 h-3" />, variant: 'neutral' },
    SUBMITTED: { label: 'Submitted', icon: <Clock className="w-3 h-3" />, variant: 'warning' },
    UNDER_REVIEW: { label: 'Under Review', icon: <Clock className="w-3 h-3" />, variant: 'primary' },
    APPROVED: { label: 'Approved', icon: <CheckCircle className="w-3 h-3" />, variant: 'success' },
    REJECTED: { label: 'Needs Changes', icon: <XCircle className="w-3 h-3" />, variant: 'danger' },
    RESUBMITTED: { label: 'Resubmitted', icon: <RotateCcw className="w-3 h-3" />, variant: 'secondary' },
  };

  const config = configs[status] || configs.DRAFT;

  return (
    <Badge variant={config.variant} size={size}>
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
};

export const LearningStatusBadge: React.FC<{ status: LearningStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  if (status === 'COMPLETED') {
    return (
      <Badge variant="success" size={size}>
        <CheckCircle className="w-3 h-3" />
        <span>Completed</span>
      </Badge>
    );
  }
  if (status === 'PAUSED') {
    return (
      <Badge variant="warning" size={size}>
        <Clock className="w-3 h-3" />
        <span>Paused</span>
      </Badge>
    );
  }
  return (
    <Badge variant="primary" size={size}>
      <Clock className="w-3 h-3" />
      <span>In Progress</span>
    </Badge>
  );
};
