import { createPortal } from 'react-dom';

export default function ConfirmDialog({
  open,
  title = 'Confirmar eliminacion',
  message,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel
}) {
  if (!open) return null;

  return createPortal(
    <div className="confirm-dialog-backdrop" role="presentation">
      <section className="confirm-dialog sitmas-card" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <div className="confirm-dialog-icon" aria-hidden="true">
          <span className="material-symbols-outlined">delete</span>
        </div>
        <div className="confirm-dialog-content">
          <h2 id="confirm-dialog-title">{title}</h2>
          <p>{message}</p>
          <div className="confirm-dialog-actions">
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>{cancelText}</button>
            <button type="button" className="btn-submit btn-sitmas-danger py-2 shadow-sm" onClick={onConfirm}>{confirmText}</button>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}
