import { useEffect, useRef, type ReactNode } from "react";
export function Modal({
  title,
  children,
  onClose,
  mandatory = false,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  mandatory?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    ref.current
      ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
      ?.focus();
    return () => {
      ref.current?.close();
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    if (document.activeElement === ref.current)
      ref.current
        ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
        ?.focus();
  });
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(e) => {
        if (mandatory) e.preventDefault();
        else onClose?.();
      }}
    >
      <div className="modal-head">
        <h2 id="modal-title">{title}</h2>
        {!mandatory && (
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        )}
      </div>
      {children}
    </dialog>
  );
}
