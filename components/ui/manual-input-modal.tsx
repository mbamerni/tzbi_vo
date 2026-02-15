import React, { useState } from "react";

interface ManualInputModalProps {
    current: number;
    max: number;
    onSave: (val: number) => void;
    onClose: () => void;
}

export function ManualInputModal({ current, max, onSave, onClose }: ManualInputModalProps) {
    const [val, setVal] = useState(current.toString());

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-card rounded-2xl p-6 w-full max-w-xs shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4 text-center">تعديل العدد يدوياً</h3>
                <input
                    type="number"
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    className="w-full text-center text-3xl font-bold bg-secondary rounded-xl py-4 mb-6 focus:outline-none focus:ring-2 ring-primary"
                    autoFocus
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-medium">إلغاء</button>
                    <button
                        onClick={() => {
                            const num = parseInt(val);
                            if (!isNaN(num)) onSave(Math.min(num, max));
                            onClose();
                        }}
                        className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
                    >
                        حفظ
                    </button>
                </div>
            </div>
        </div>
    )
}
