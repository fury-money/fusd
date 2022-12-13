import React, { ReactElement, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { MultiTimer } from './MultiTimer';

export interface SnackbarProps {
  children: ReactElement;
  autoClose?: number | false;
  className?: string;
  onClose?: () => void;
  primaryId?: number;
  timer?: MultiTimer;
}

export const SnackbarBase: React.FC<Partial<SnackbarProps>> = (
  props: Partial<SnackbarProps>,
) => {
  useEffect(() => {
    if (typeof props.autoClose === 'number' && props.timer) {
      props.timer.start(props.autoClose, onClose);
    }
    return onClose;
  });
  /*
    const close = () => {
      onClose();
    };
  */

  const onMouseEnter = () => {
    props.timer?.pause();
  };

  const onMouseLeave = () => {
    props.timer?.resume();
  };

  const onClose = () => {
    props.timer?.stop(onClose);

    if (typeof props.onClose === 'function') {
      props.onClose();
    }
  };

  return (
    <div
      className={props.className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {props.children &&
        React.cloneElement(props.children, {
          onClose: onClose,
        })}
    </div>
  );
};

const entryKeyframes = keyframes`
  0% {
    opacity: 0;
  }
  
  100% {
    opacity: 1;
  }
`;

export const Snackbar = styled(SnackbarBase)`
  opacity: 1;
  animation: ${entryKeyframes} 0.5s ease-out;
`;
