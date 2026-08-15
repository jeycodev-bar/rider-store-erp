// // src/components/ui/Modal.tsx
// import { useEffect, type ReactNode } from "react";
// import { createPortal } from "react-dom";
// import { X } from "lucide-react";

// interface ModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     title: string;
//     children: ReactNode;
// }

// export function Modal({ isOpen, onClose, title, children }: ModalProps) {
//     // Cerrar con Escape — comportamiento esperado de cualquier modal.
//     useEffect(() => {
//         if (!isOpen) return;
//         function handleKeyDown(e: KeyboardEvent) {
//             if (e.key === "Escape") onClose();
//         }
//         window.addEventListener("keydown", handleKeyDown);
//         return () => window.removeEventListener("keydown", handleKeyDown);
//     }, [isOpen, onClose]);

//     if (!isOpen) return null;

//     return createPortal(
//         <div
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
//             onClick={onClose}
//             role="presentation"
//         >
//             <div
//                 role="dialog"
//                 aria-modal="true"
//                 aria-labelledby="modal-title"
//                 onClick={(e) => e.stopPropagation()}
//                 className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-lg"
//             >
//                 <div className="mb-4 flex items-center justify-between">
//                     <h2 id="modal-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
//                         {title}
//                     </h2>
//                     <button
//                         onClick={onClose}
//                         aria-label="Cerrar"
//                         className="rounded-md p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
//                     >
//                         <X size={18} />
//                     </button>
//                 </div>
//                 {children}
//             </div>
//         </div>,
//         document.body
//     );
// }



// src/components/ui/Modal.tsx
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// 1. Agregamos un diccionario de tamaños fuera del componente
const SIZE_CLASSES = {
    sm: "max-w-sm",
    md: "max-w-lg",      // El original (por defecto)
    lg: "max-w-2xl",
    xl: "max-w-4xl",     // Ideal para la mayoría de tablas
    "2xl": "max-w-6xl",  // Para catálogos con muchas columnas
    full: "max-w-[95vw]" // Ocupa casi toda la pantalla
} as const;

type ModalSize = keyof typeof SIZE_CLASSES;

// 2. Agregamos la propiedad 'size' opcional
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: ModalSize;
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
    // Cerrar con Escape — comportamiento esperado de cualquier modal.
    useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
            role="presentation"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onClick={(e) => e.stopPropagation()}
                // 3. Reemplazamos "max-w-lg" por la clase dinámica
                className={`max-h-[90vh] w-full ${SIZE_CLASSES[size]} overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-lg`}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 id="modal-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="rounded-md p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                    >
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
}