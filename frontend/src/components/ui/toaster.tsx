"use client"

import { Toaster as ToastContainer } from 'react-hot-toast'

export function Toaster() {
    return (
    <ToastContainer
    position="top-right"
    reverseOrder={false}
    gutter={8}
    />
    );
}