import React from 'react';
import { CatalogItemDef } from './itemRegistry';

interface AerospaceItemIconProps {
  iconId: CatalogItemDef['svgIconId'];
  className?: string;
}

/**
 * Code-authored industrial aerospace SVG equipment silhouettes (Prompt 2 Section 2).
 * Each icon uses a dark structural chassis, interior detail, and distinct silhouette.
 */
export const AerospaceItemIcon: React.FC<AerospaceItemIconProps> = ({
  iconId,
  className = 'w-6 h-6'
}) => {
  switch (iconId) {
    case 'flashlight':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3" y="9" width="11" height="6" rx="1.5" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.5" />
          <path d="M14 8L19 6V18L14 16V8Z" fill="#334155" stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1="6" y1="9" x2="6" y2="15" stroke="#F59E0B" strokeWidth="1.5" />
          <line x1="9" y1="9" x2="9" y2="15" stroke="#64748B" strokeWidth="1.2" />
          <path d="M20 8L22.5 6.5M20 12H23M20 16L22.5 17.5" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'wiper':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="5" width="16" height="5" rx="1" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
          <path d="M5 10H19L18 13H6L5 10Z" fill="#F59E0B" />
          <rect x="10.5" y="13" width="3" height="7" rx="1" fill="#475569" stroke="#CBD5E1" strokeWidth="1.2" />
          <path d="M6 3L8 4M18 3L16 4M12 2V4" stroke="#38BDF8" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );

    case 'patch':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2.5" fill="#7C2D12" stroke="#F59E0B" strokeWidth="1.5" />
          <rect x="7" y="7" width="10" height="10" rx="1.5" fill="#EA580C" stroke="#FDE68A" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <circle cx="6" cy="6" r="0.9" fill="#FDE68A" />
          <circle cx="18" cy="6" r="0.9" fill="#FDE68A" />
          <circle cx="6" cy="18" r="0.9" fill="#FDE68A" />
          <circle cx="18" cy="18" r="0.9" fill="#FDE68A" />
        </svg>
      );

    case 'battery':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="7" y="2.5" width="4" height="2.5" rx="0.5" fill="#F59E0B" />
          <rect x="13" y="2.5" width="4" height="2.5" rx="0.5" fill="#38BDF8" />
          <rect x="5" y="5" width="14" height="16" rx="2" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="7.5" y="8" width="9" height="2.5" rx="0.5" fill="#10B981" />
          <rect x="7.5" y="12" width="9" height="2.5" rx="0.5" fill="#10B981" />
          <rect x="7.5" y="16" width="9" height="2.5" rx="0.5" fill="#38BDF8" />
        </svg>
      );

    case 'ration':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M5 4H19L20 7V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V7L5 4Z" fill="#1E293B" stroke="#CBD5E1" strokeWidth="1.5" />
          <line x1="4.5" y1="7" x2="19.5" y2="7" stroke="#F59E0B" strokeWidth="1.5" />
          <rect x="7" y="10" width="10" height="7" rx="1" fill="#064E3B" stroke="#10B981" strokeWidth="1.2" />
          <path d="M10 14C10 12.5 11.5 11.5 13 12.5C13.5 14 12 15.5 10 14Z" fill="#34D399" />
        </svg>
      );

    case 'water':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="8" y="2.5" width="8" height="2.5" rx="0.8" fill="#475569" stroke="#CBD5E1" strokeWidth="1.2" />
          <rect x="5" y="5" width="14" height="16" rx="2.5" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="5" y1="10" x2="19" y2="10" stroke="#0284C7" strokeWidth="1.2" />
          <line x1="5" y1="16" x2="19" y2="16" stroke="#0284C7" strokeWidth="1.2" />
          <path d="M12 9.5L9.8 13C9.2 14 9.9 15.5 12 15.5C14.1 15.5 14.8 14 14.2 13L12 9.5Z" fill="#38BDF8" />
        </svg>
      );

    case 'mineral':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <polygon points="12,3 19,7 20,15 14,20 6,19 4,11" fill="#7C2D12" stroke="#F97316" strokeWidth="1.5" />
          <polyline points="12,3 13,11 20,15" stroke="#FDBA74" strokeWidth="1.2" />
          <polyline points="4,11 13,11 14,20" stroke="#EA580C" strokeWidth="1.2" />
        </svg>
      );

    case 'aerogel':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="5" width="16" height="14" rx="2" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="4" y1="9.5" x2="20" y2="9.5" stroke="#F59E0B" strokeWidth="1.2" />
          <line x1="4" y1="14.5" x2="20" y2="14.5" stroke="#F59E0B" strokeWidth="1.2" />
          <line x1="9.5" y1="5" x2="9.5" y2="19" stroke="#38BDF8" strokeWidth="1.1" strokeDasharray="2 2" />
          <line x1="14.5" y1="5" x2="14.5" y2="19" stroke="#38BDF8" strokeWidth="1.1" strokeDasharray="2 2" />
        </svg>
      );

    case 'analyzer':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path d="M5 6H16L19 9V14L15 14V20H9V14H5V6Z" fill="#1E293B" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="7" y="8" width="6" height="4" rx="0.6" fill="#064E3B" stroke="#10B981" strokeWidth="1.2" />
          <path d="M19 10.5L22.5 9M19 12L22.5 13.5" stroke="#F43F5E" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );

    case 'vial':
    case 'specimen_rock':
    case 'specimen_hematite':
    case 'specimen_ice':
    case 'specimen_gas': {
      const coreColor =
        iconId === 'specimen_ice'
          ? '#38BDF8'
          : iconId === 'specimen_hematite'
          ? '#94A3B8'
          : iconId === 'specimen_gas'
          ? '#10B981'
          : iconId === 'specimen_rock'
          ? '#EA580C'
          : '#475569';
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="8" y="2.5" width="8" height="3" rx="0.8" fill="#D97706" stroke="#FDE68A" strokeWidth="1.2" />
          <rect x="7.5" y="5.5" width="9" height="15.5" rx="2.5" fill="#0F172A" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="9.2" y="9" width="5.6" height="9.5" rx="1.2" fill={coreColor} />
          <line x1="7.5" y1="8" x2="16.5" y2="8" stroke="#F59E0B" strokeWidth="1.2" />
        </svg>
      );
    }

    case 'gasket':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke="#F97316" strokeWidth="2.4" fill="none" />
          <circle cx="12" cy="12" r="4.5" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
        </svg>
      );

    case 'repair_kit':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="3.5" y="7" width="17" height="13" rx="2" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
          <path d="M9 7V5C9 4.4 9.4 4 10 4H14C14.6 4 15 4.4 15 5V7" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M9.5 13.5H14.5M12 11V16" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'beacon':
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle cx="12" cy="7" r="2.2" fill="#38BDF8" />
          <path d="M7.5 4.5C5.5 6.5 5.5 9.5 7.5 11.5M16.5 4.5C18.5 6.5 18.5 9.5 16.5 11.5" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 9.5V19M8 20H16L14 16H10L8 20Z" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'blueprint':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" fill="#0B192C" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 1.5" />
          <circle cx="12" cy="12" r="4" stroke="#38BDF8" strokeWidth="1.3" />
          <line x1="6" y1="12" x2="18" y2="12" stroke="#38BDF8" strokeWidth="1" opacity="0.6" />
          <line x1="12" y1="6" x2="12" y2="18" stroke="#38BDF8" strokeWidth="1" opacity="0.6" />
        </svg>
      );
  }
};

export default AerospaceItemIcon;
