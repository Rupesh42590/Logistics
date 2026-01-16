import React from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onClose, loading }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-content" style={{ maxWidth: '400px', width: '90%' }}>
        <h3 className="modal-title" style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          {message}
        </p>
        <div className="modal-actions" style={{ justifyContent: 'flex-end', gap: '1rem' }}>
          <button 
            onClick={onClose} 
            className="btn" 
            disabled={loading}
            style={{ border: '1px solid var(--border)' }}
          >
            {onConfirm ? 'Cancel' : 'OK'}
          </button>
          {onConfirm && (
            <button 
                onClick={onConfirm} 
                className="btn btn-primary"
                disabled={loading}
                style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
            >
                {loading ? 'Processing...' : 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
