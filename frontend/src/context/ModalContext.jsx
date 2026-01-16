import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmModal from '../components/ConfirmModal';

const ModalContext = createContext();

export function useModal() {
  return useContext(ModalContext);
}

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onClose: null, // Optional custom close handler
    loading: false
  });

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    if (modalState.onClose) {
      modalState.onClose();
    }
  }, [modalState]);

  const showAlert = useCallback((title, message, onOk = null) => {
    setModalState({
      isOpen: true,
      title,
      message,
      onConfirm: null, // No confirm action implies "Alert/Info" mode in ConfirmModal
      onClose: onOk,
      loading: false
    });
  }, []);

  const showConfirm = useCallback((title, message, onConfirm) => {
    setModalState({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        try {
            setModalState(prev => ({ ...prev, loading: true }));
            await onConfirm();
            setModalState(prev => ({ ...prev, isOpen: false, loading: false }));
        } catch (error) {
            console.error("Modal confirm action failed", error);
            setModalState(prev => ({ ...prev, loading: false }));
            // Optionally show error alert here, or let the caller handle it
        }
      },
      loading: false
    });
  }, []);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onClose={closeModal}
        loading={modalState.loading}
      />
    </ModalContext.Provider>
  );
}
