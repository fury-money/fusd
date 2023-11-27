import { ComponentType } from "react";
import { ErrorBoundary, ErrorBoundaryProps } from "./ErrorBoundary";

let ErrorBoundaryComponent: ComponentType<ErrorBoundaryProps> = ErrorBoundary;

export function configErrorBoundary(ErrorBoundary: ComponentType<ErrorBoundaryProps>): void {
  ErrorBoundaryComponent = ErrorBoundary;
}

export function getErrorBoundary(): ComponentType<ErrorBoundaryProps> {
  return ErrorBoundaryComponent;
}
