'use client';

import { useState } from 'react';

interface DisclaimerModalProps {
  onConfirm: (introNote: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function DisclaimerModal({ onConfirm, onCancel, isSubmitting }: DisclaimerModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [introNote, setIntroNote] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Request a Connection</h2>
        <p className="text-sm text-gray-500 mb-4">
          This will share your contact details with the founder if they approve your request.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <label className="flex items-start gap-2 text-xs text-amber-900 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I understand this is a private placement opportunity under the Companies Act, 2013.
              Sprezox is a technology platform — not a broker, investment advisor, or SEBI-registered
              intermediary. Sprezox does not verify, endorse, or guarantee the accuracy of any
              information shared. I am responsible for my own due diligence before contacting the
              founder or making any investment decision.
            </span>
          </label>
        </div>

        <textarea
          rows={3}
          value={introNote}
          onChange={(e) => setIntroNote(e.target.value)}
          maxLength={500}
          placeholder="Optional: a short note introducing yourself to the founder"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(introNote)}
            disabled={!accepted || isSubmitting}
            className="flex-1 bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Confirm Request'}
          </button>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}