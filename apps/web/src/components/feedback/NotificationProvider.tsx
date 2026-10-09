"use client";

import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  TriangleAlert,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastTone =
  | "success"
  | "error"
  | "warning"
  | "info";

type ToastInput = {
  title?: string;
  message: string;
  tone?: ToastTone;
  duration?: number;
};

type Toast = Required<
  Pick<ToastInput, "message" | "tone">
> &
  Pick<ToastInput, "title"> & {
    id: string;
    duration: number;
  };

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

type NotificationContextValue = {
  notify: (input: ToastInput) => void;
  success: (
    message: string,
    title?: string,
  ) => void;
  error: (
    message: string,
    title?: string,
  ) => void;
  warning: (
    message: string,
    title?: string,
  ) => void;
  info: (
    message: string,
    title?: string,
  ) => void;
  confirm: (
    options: ConfirmOptions,
  ) => Promise<boolean>;
};

const NotificationContext =
  createContext<NotificationContextValue | null>(
    null,
  );

type PendingConfirmation = {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

export function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<
    Toast[]
  >([]);

  const [
    pendingConfirmation,
    setPendingConfirmation,
  ] =
    useState<PendingConfirmation | null>(
      null,
    );

  const timers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  const dismiss = useCallback(
    (id: string) => {
      const timer =
        timers.current.get(id);

      if (timer) {
        clearTimeout(timer);
        timers.current.delete(id);
      }

      setToasts((current) =>
        current.filter(
          (toast) => toast.id !== id,
        ),
      );
    },
    [],
  );

  const notify = useCallback(
    ({
      title,
      message,
      tone = "info",
      duration = 4200,
    }: ToastInput) => {
      const id =
        crypto.randomUUID();

      const toast: Toast = {
        id,
        title,
        message,
        tone,
        duration,
      };

      setToasts((current) => [
        ...current,
        toast,
      ]);

      const timer = setTimeout(() => {
        setToasts((current) =>
          current.filter(
            (item) => item.id !== id,
          ),
        );

        timers.current.delete(id);
      }, duration);

      timers.current.set(id, timer);
    },
    [],
  );

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPendingConfirmation({
          options,
          resolve,
        });
      }),
    [],
  );

  const closeConfirmation = useCallback(
    (result: boolean) => {
      setPendingConfirmation(
        (current) => {
          current?.resolve(result);
          return null;
        },
      );
    },
    [],
  );

  const value = useMemo<
    NotificationContextValue
  >(
    () => ({
      notify,

      success: (message, title) =>
        notify({
          message,
          title,
          tone: "success",
        }),

      error: (message, title) =>
        notify({
          message,
          title,
          tone: "error",
          duration: 6000,
        }),

      warning: (message, title) =>
        notify({
          message,
          title,
          tone: "warning",
        }),

      info: (message, title) =>
        notify({
          message,
          title,
          tone: "info",
        }),

      confirm,
    }),
    [notify, confirm],
  );

  return (
    <NotificationContext.Provider
      value={value}
    >
      {children}

      <ToastViewport
        toasts={toasts}
        dismiss={dismiss}
      />

      {pendingConfirmation && (
        <ConfirmationDialog
          options={
            pendingConfirmation.options
          }
          onConfirm={() =>
            closeConfirmation(true)
          }
          onCancel={() =>
            closeConfirmation(false)
          }
        />
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(
    NotificationContext,
  );

  if (!context) {
    throw new Error(
      "useNotification must be used within NotificationProvider.",
    );
  }

  return context;
}

function ToastViewport({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: string) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-4 top-[76px] z-[100] flex flex-col items-end gap-2 sm:left-auto sm:right-5 sm:w-[360px]"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          dismiss={() =>
            dismiss(toast.id)
          }
        />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  dismiss,
}: {
  toast: Toast;
  dismiss: () => void;
}) {
  const Icon =
    toast.tone === "success"
      ? CheckCircle2
      : toast.tone === "error"
        ? AlertCircle
        : toast.tone === "warning"
          ? TriangleAlert
          : Info;

  const toneClass =
    toast.tone === "success"
      ? "text-emerald-600"
      : toast.tone === "error"
        ? "text-red-600"
        : toast.tone === "warning"
          ? "text-amber-600"
          : "text-blue-600";

  return (
    <div
      role={
        toast.tone === "error"
          ? "alert"
          : "status"
      }
      className="pointer-events-auto w-full border border-neutral-200 bg-white shadow-md"
    >
      <div className="flex gap-3 px-4 py-3.5">
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${toneClass}`}
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          {toast.title && (
            <p className="text-sm font-semibold text-neutral-950">
              {toast.title}
            </p>
          )}

          <p
            className={`text-sm leading-5 text-neutral-600 ${
              toast.title ? "mt-0.5" : ""
            }`}
          >
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss notification"
          className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ConfirmationDialog({
  options,
  onConfirm,
  onCancel,
}: {
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
        className="w-full max-w-md border border-neutral-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="confirmation-title"
              className="text-lg font-semibold text-neutral-950"
            >
              {options.title}
            </h2>

            <p
              id="confirmation-message"
              className="mt-2 text-sm leading-6 text-neutral-600"
            >
              {options.message}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation"
            className="flex h-8 w-8 shrink-0 items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-500"
          >
            {options.cancelLabel ??
              "Cancel"}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white transition ${
              options.tone === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-neutral-950 hover:bg-neutral-800"
            }`}
          >
            {options.confirmLabel ??
              "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}