import React from "react";
import type { HTMLAttributes, ReactNode } from "react";

export interface RowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** A single horizontal row of keys. Presentational — layout comes from flexbox. */
export const Row = React.memo(function Row({ children, ...rest }: RowProps) {
  return <div {...rest}>{children}</div>;
});

Row.displayName = "Row";
