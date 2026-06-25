import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showSuccess?: boolean;
  icon?: React.ReactNode;
  onValidationChange?: (isValid: boolean) => void;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, label, error, showSuccess, icon, type = "text", id, onValidationChange, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [emailValid, setEmailValid] = React.useState<boolean | null>(null);

    // Support internal or external state tracking
    const [localValue, setLocalValue] = React.useState((props.value || props.defaultValue || "").toString());

    React.useEffect(() => {
      if (props.value !== undefined) {
        setLocalValue(props.value.toString());
      }
    }, [props.value]);

    const hasValue = localValue !== "";

    // Live validation for email
    React.useEffect(() => {
      if (type === "email") {
        if (!localValue) {
          setEmailValid(null);
          onValidationChange?.(false);
        } else {
          const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localValue);
          setEmailValid(isValid);
          onValidationChange?.(isValid);
        }
      }
    }, [localValue, type, onValidationChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;

      // Phone formatting: (555) 123-4567 — block letters/emails in phone fields
      if (type === "tel") {
        val = val.replace(/[a-zA-Z@]/g, "");
        const digits = val.replace(/\D/g, "");
        const limited = digits.slice(0, 10);
        let formatted = "";

        if (limited.length > 0) {
          formatted = "(" + limited.slice(0, 3);
        }
        if (limited.length > 3) {
          formatted += ") " + limited.slice(3, 6);
        }
        if (limited.length > 6) {
          formatted += "-" + limited.slice(6, 10);
        }
        val = formatted;
        e.target.value = val;
      }

      setLocalValue(val);
      props.onChange?.(e);
    };

    // Determine current type (toggle text/password)
    const isPassword = type === "password";
    const currentType = isPassword ? (showPassword ? "text" : "password") : type;
    const resolvedInputMode =
      props.inputMode ??
      (type === "tel" ? "tel" : type === "email" ? "email" : type === "number" ? "decimal" : undefined);
    const resolvedAutoComplete =
      props.autoComplete ??
      (type === "email"
        ? "email"
        : type === "tel"
          ? "tel"
          : type === "password"
            ? "current-password"
            : undefined);

    // Derived error status
    const hasError = !!error || (type === "email" && emailValid === false);
    const isValidSuccess = showSuccess || (type === "email" && emailValid === true);
    const errorId = id ? `${id}-error` : undefined;
    const errorMessage = error || (hasError ? "Invalid format." : undefined);

    return (
      <div className="form-input-container group font-sans">
        <div className="relative flex items-center">
          {/* Left Icon */}
          {icon && (
            <div className="absolute left-4 text-white/30 group-focus-within:text-[#FF7A59] transition-colors pointer-events-none z-10">
              {icon}
            </div>
          )}

          {/* Actual Input */}
          <input
            ref={ref}
            type={currentType}
            id={id}
            inputMode={resolvedInputMode}
            autoComplete={resolvedAutoComplete}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError && errorId ? errorId : undefined}
            placeholder=" "
            value={props.value !== undefined ? props.value : localValue}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            onChange={handleInputChange}
            className={cn(
              "floating-input text-xs sm:text-sm",
              icon && "floating-input-icon",
              hasValue && "floating-input-active",
              hasError
                ? "border-red-500/50 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-red-950/5"
                : "focus:border-[#FF7A59] focus:shadow-[0_0_20px_rgba(255,122,89,0.15)]",
              isValidSuccess && !hasError && "border-green-500/50 focus:border-green-500",
              className
            )}
            {...props}
          />

          {/* Floating Label */}
          <label
            htmlFor={id}
            className={cn(
              "floating-label font-bold text-[10px] sm:text-xs",
              icon && "floating-label-icon",
              (focused || hasValue) && "floating-label-active text-[9px] text-[#FF7A59]",
              hasError && "text-red-400",
              isValidSuccess && !hasError && "text-green-400"
            )}
          >
            {label}
          </label>

          {/* Right Accessories (eye toggle or success/error validation icon) */}
          <div className="absolute right-4 flex items-center gap-2 z-10">
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-white/30 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}

            {hasError && <AlertCircle className="text-red-500 w-4 h-4 animate-pulse" />}
            {isValidSuccess && !hasError && <CheckCircle2 className="text-green-500 w-4 h-4" />}
          </div>
        </div>

        {/* Display validation errors */}
        {hasError && errorMessage && (
          <p
            id={errorId}
            role="alert"
            className="text-[11px] text-red-500 font-semibold mt-1.5 ml-1 animate-fadeIn"
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
