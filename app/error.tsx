'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
            <h2 className="mb-4 text-2xl font-bold text-foreground">حدث خطأ ما!</h2>
            <p className="mb-6 text-muted-foreground">
                نعتذر عن هذا الخلل. حاول إعادة تحميل الصفحة.
            </p>
            <button
                onClick={reset}
                className="rounded-xl bg-primary px-6 py-3 text-primary-foreground transition-opacity hover:opacity-90"
            >
                إعادة المحاولة
            </button>
        </div>
    );
}
