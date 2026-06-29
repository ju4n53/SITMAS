import { useState } from 'react';

export default function AccordionCard({ title, children, defaultOpen = false, open: controlledOpen, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;

  function toggleOpen() {
    const nextOpen = !open;
    if (onOpenChange) {
      onOpenChange(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
  }

  return (
    <section className="sitmas-card mb-4">
      <button type="button" className="accordion-header" onClick={toggleOpen} aria-expanded={open}>
        <h2 className="mb-0">{title}</h2>
        <span className={`icon-arrow ${open ? 'is-open' : ''}`}>v</span>
      </button>
      <div className={`accordion-body-panel ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="accordion-body-content">{children}</div>
      </div>
    </section>
  );
}
