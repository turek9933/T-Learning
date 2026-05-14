import toast from 'react-hot-toast'
import { CircleCheck, TriangleAlert, OctagonX } from 'lucide-react'

interface ToastOptions {
    duration?: number
    id?: string
}

const baseClass = `
    flex items-center gap-3
    px-4 py-3
    rounded-lg border
    shadow-md
    font-body text-sm font-regular
    transition-opacity duration-200
`

const variants = {
    success: `bg-success-subtle text-success border-success`,
    warning: `bg-warning-subtle text-warning border-warning`,
    error:   `bg-error-subtle text-error border-error`,
}
const icons = {
    success: CircleCheck,
    warning: TriangleAlert,
    error:   OctagonX,
}

function createToast(
    type: keyof typeof variants,
    message: string,
    options?: ToastOptions
) {
    const Icon = icons[type];

    toast.custom(
        (t) => (
            <div 
            className={`
                ${baseClass} ${variants[type]}
                ${t.visible ? 'opacity-100' : 'opacity-0'}
            `}>
                <Icon className="size-5 shrink-0" />
                <span>{message}</span>
                <button
                onClick={() => toast.dismiss(t.id)}
                className="ml-auto opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="close"
                >
                    X
                </button>
            </div>
        ),
        {
            duration: options?.duration ?? 4000,
            id: options?.id,
        }
    )
}

export const customToast = {
    success: (message: string, options?: ToastOptions) =>
        createToast('success', message, options),
    
    warning: (message: string, options?: ToastOptions) =>
        createToast('warning', message, options),
    
    error: (message: string, options?: ToastOptions) =>
        createToast('error', message, options),
}