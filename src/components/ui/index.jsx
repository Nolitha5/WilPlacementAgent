/**
 * src/components/ui/index.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Barrel export for all shared UI primitives.
 * Usage: import { Badge, Modal, Toast, Spinner } from "../../components/ui";
 */

import { STATUS } from "../../utils/constants";
import { Ico }   from "../icons/Icons";

// ── Status Badge ──────────────────────────────────────────────────────────────
export function Badge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.label}
    </span>
  );
}

// ── Gradient stat card ────────────────────────────────────────────────────────
export function StatCard({ label, value, gradient }) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${gradient}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value ?? "—"}</p>
    </div>
  );
}

// ── Generic centred modal ─────────────────────────────────────────────────────
export function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ── Destructive confirm dialog ────────────────────────────────────────────────
export function ConfirmModal({ message, sub, onConfirm, onCancel, confirmLabel = "Delete" }) {
  return (
    <Modal onClose={onCancel}>
      <div className="p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Ico.Trash className="w-5 h-5 text-red-600" />
        </div>
        <h3 className="font-bold text-gray-800 mb-1">{message}</h3>
        {sub && <p className="text-sm text-gray-500 mb-5">{sub}</p>}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Toast notification ────────────────────────────────────────────────────────
export function Toast({ message, type = "success" }) {
  const colors = { success: "bg-green-600", error: "bg-red-600", info: "bg-indigo-600" };
  return (
    <div className={`fixed bottom-6 right-6 z-50 ${colors[type]} text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2`}>
      {type === "success"
        ? <Ico.Check className="w-4 h-4" />
        : <Ico.X    className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ── Loading spinner ───────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

// ── Skills match progress bar ─────────────────────────────────────────────────
export function MatchBar({ percent }) {
  const color    = percent >= 70 ? "bg-green-500"   : percent >= 40 ? "bg-amber-400"   : "bg-red-400";
  const txtColor = percent >= 70 ? "text-green-600" : percent >= 40 ? "text-amber-600" : "text-red-500";
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Skills match</span>
        <span className={`font-semibold ${txtColor}`}>{percent}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

// ── Section page header ───────────────────────────────────────────────────────
export function PageHeader({ title, sub }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      {sub && <p className="text-gray-500 text-sm mt-1">{sub}</p>}
    </div>
  );
}
