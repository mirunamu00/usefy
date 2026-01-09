import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

/**
 * Button variant styles
 */
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

/**
 * Button size options
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Props for the Button component
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The visual style variant of the button
   * @default "primary"
   */
  variant?: ButtonVariant;

  /**
   * The size of the button
   * @default "md"
   */
  size?: ButtonSize;

  /**
   * Whether the button is in a loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Content to display on the left side of the button text
   */
  leftIcon?: ReactNode;

  /**
   * Content to display on the right side of the button text
   */
  rightIcon?: ReactNode;

  /**
   * Button contents
   */
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
  },
  secondary: {
    backgroundColor: "#6b7280",
    color: "#ffffff",
    border: "none",
  },
  outline: {
    backgroundColor: "transparent",
    color: "#3b82f6",
    border: "1px solid #3b82f6",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "#3b82f6",
    border: "none",
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: "6px 12px",
    fontSize: "14px",
  },
  md: {
    padding: "8px 16px",
    fontSize: "16px",
  },
  lg: {
    padding: "12px 24px",
    fontSize: "18px",
  },
};

const baseStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  borderRadius: "6px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const disabledStyles: React.CSSProperties = {
  opacity: 0.5,
  cursor: "not-allowed",
};

/**
 * A customizable button component with variants, sizes, and loading state.
 *
 * @example
 * ```tsx
 * import { Button } from "@usefy/button";
 *
 * function App() {
 *   return (
 *     <Button variant="primary" size="md" onClick={() => console.log("clicked")}>
 *       Click me
 *     </Button>
 *   );
 * }
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const combinedStyles: React.CSSProperties = {
      ...baseStyles,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...(isDisabled ? disabledStyles : {}),
      ...style,
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        style={combinedStyles}
        {...props}
      >
        {loading ? (
          <span aria-label="Loading">⏳</span>
        ) : (
          <>
            {leftIcon && <span>{leftIcon}</span>}
            {children}
            {rightIcon && <span>{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
