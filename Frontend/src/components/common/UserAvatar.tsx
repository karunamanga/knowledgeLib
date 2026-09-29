import React from 'react';
import { clsx } from 'clsx';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm font-semibold',
  lg: 'w-14 h-14 text-lg font-bold',
  xl: 'w-20 h-20 text-2xl font-bold',
};

// Deterministic pastel color generator based on name
const getGradientByName = (name: string) => {
  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-fuchsia-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className,
}) => {
  const initial = (name || 'U').trim().charAt(0).toUpperCase();
  const gradient = getGradientByName(name || 'User');

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={clsx(
          'rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0 border border-slate-200 dark:border-slate-700',
          sizeClasses[size],
          className
        )}
        onError={(e) => {
          // If image fails to load, fallback to initial
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center text-white shadow-sm shrink-0 select-none bg-gradient-to-tr ring-2 ring-indigo-500/20 font-medium',
        gradient,
        sizeClasses[size],
        className
      )}
    >
      <span>{initial}</span>
    </div>
  );
};
