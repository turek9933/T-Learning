"use client"

import { ToastContainer } from 'react-toastify'
import { useTheme } from '@/components/ThemeProvider'

export function Toaster() {
    const { theme } = useTheme();

    return (
    <ToastContainer
    />
    )
}