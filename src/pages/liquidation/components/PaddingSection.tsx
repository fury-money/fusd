import { flat } from '@libs/styled-neumorphism';
import React, { DetailedHTMLProps, HTMLAttributes } from 'react';
import styled from 'styled-components';
import { getErrorBoundary } from '@libs/neumorphism-ui/components/configErrorBoundary';

export interface SectionProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
  padding?: string;
}

function SectionBase({
  children,
  className,
  padding,
  ...sectionProps
}: SectionProps) {
  const ErrorBoundary = getErrorBoundary();

  return (
    <section className={`NeuSection-root ${className}`} {...sectionProps}>
      <div className="NeuSection-content" style={{ padding }}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
    </section>
  );
}

/**
 * Styled `<section/>` tag
 */
export const PaddingSection = styled(SectionBase)`
  border-radius: 20px;

  min-width: 0;

  color: ${({ theme }) => theme.textColor};

  ${({ theme }) =>
    flat({
      color: theme.sectionBackgroundColor,
      backgroundColor: theme.sectionBackgroundColor,
      distance: 1,
      intensity: theme.intensity,
    })};

  .NeuSection-content {
    padding: 6px;
  }
`;
