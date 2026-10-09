import React from 'react';
import { ActiveTab } from '../types';
import { 
  Building2, 
  Search, 
  FileText, 
  XCircle, 
  RotateCcw, 
  Layers, 
  CheckCircle2 
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onResetData: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onResetData,
  isResetting
}) => {
  return (
    <header style={{
      backgroundColor: '#0f172a',
      color: '#ffffff',
      borderBottom: '1px solid #1e293b',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('search')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #0d9488)',
            padding: '0.5rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              StayEase
              <span style={{
                fontSize: '0.65rem',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>LLD Round 2</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Online Hotel Booking Platform
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('search')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: activeTab === 'search' ? '#2563eb' : 'transparent',
              color: activeTab === 'search' ? '#ffffff' : '#cbd5e1'
            }}
          >
            <Search size={15} />
            Search Hotels
          </button>

          <button
            onClick={() => setActiveTab('find')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: activeTab === 'find' ? '#2563eb' : 'transparent',
              color: activeTab === 'find' ? '#ffffff' : '#cbd5e1'
            }}
          >
            <FileText size={15} />
            Find Booking
          </button>

          <button
            onClick={() => setActiveTab('cancel')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: activeTab === 'cancel' ? '#ef4444' : 'transparent',
              color: activeTab === 'cancel' ? '#ffffff' : '#cbd5e1'
            }}
          >
            <XCircle size={15} />
            Cancellation
          </button>

          <button
            onClick={() => setActiveTab('lld')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: activeTab === 'lld' ? '#0d9488' : '#1e293b',
              color: activeTab === 'lld' ? '#ffffff' : '#2dd4bf',
              border: '1px solid #14b8a6'
            }}
          >
            <Layers size={15} />
            LLD Architecture
          </button>
        </nav>

        {/* Evaluation Demo Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={onResetData}
            disabled={isResetting}
            title="Reset and reseed database for a fresh demonstration"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              backgroundColor: '#334155',
              color: '#e2e8f0',
              border: '1px solid #475569'
            }}
          >
            <RotateCcw size={13} className={isResetting ? 'spinner' : ''} />
            {isResetting ? 'Resetting...' : 'Reset Demo DB'}
          </button>
        </div>
      </div>
    </header>
  );
};
