"use client";

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const controlClass =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-muted";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export function Input({ className, error, ...props }: InputProps) {
  return <input className={cn(controlClass, error && "border-red-600 focus:ring-red-100", className)} {...props} />;
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(controlClass, "min-h-28 py-3", error && "border-red-600 focus:ring-red-100", className)}
      {...props}
    />
  );
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return <select className={cn(controlClass, className)} {...props} />;
}

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      className={cn("size-5 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary", className)}
      type="checkbox"
      {...props}
    />
  );
}
