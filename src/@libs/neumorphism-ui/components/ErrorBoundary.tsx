import React, { Component, ReactNode } from 'react';
import styled from 'styled-components';

export interface ErrorBoundaryProps {
  children: ReactNode | undefined
}

interface ErrorBoundaryState {
  error: null | Error;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: unknown): void {
    this.setState({
      error,
    });

    console.error(errorInfo);
  }

  render(): ReactNode {
    if (this.state.error) {
      return <ErrorView>{this.state.error.toString()}</ErrorView>;
    }

    return this.props.children;
  }
}

const ErrorView = styled.pre`
  width: 100%;
  max-height: 500px;
  overflow-y: auto;
  font-size: 12px;
`;
