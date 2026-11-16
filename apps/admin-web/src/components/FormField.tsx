import type { InputHTMLAttributes } from 'react'

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
  containerClassName?: string
}

export function FormField({
  id,
  label,
  error,
  hint,
  className = '',
  containerClassName = '',
  ...props
}: FormFieldProps) {
  const fieldId = id ?? props.name
  const messageId = `${fieldId}-message`
  const required = props.required ?? false

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      <label
        htmlFor={fieldId}
        className={`text-sm font-medium ${required ? 'after:ml-0.5 after:text-destructive after:content-["*"]' : ''}`}
      >
        {label}
      </label>
      <input
        {...props}
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        className={`h-11 w-full rounded-lg border bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground ${error ? 'border-destructive focus-visible:ring-destructive' : 'border-input'} ${className}`}
      />
      {error ? (
        <p id={messageId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
