import MuiTooltip, {
  TooltipProps as MuiTooltipProps,
} from '@mui/material/Tooltip';
import React from 'react';
import styled from 'styled-components';
import { MessageColor } from '../themes/Theme';

export interface TooltipProps extends MuiTooltipProps {
  color?: MessageColor;
}

/**
 * Styled component of the `<Tooltip/>` of the Material-UI
 *
 * @see https://material-ui.com/api/tooltip/
 */
const TooltipBase: React.FC<TooltipProps> = ({
  arrow = true,
  ...props
}: TooltipProps) => {
  return (
    <MuiTooltip
      classes={{
        tooltip: 'tooltip-default',
        arrow: 'tooltip-arrow-default',
      }}
      arrow={arrow}
      {...props}
    />
  );
};

export const Tooltip = styled(TooltipBase)`
  .tooltip-default {
    position: relative,
    borderRadius: 3,
    color: ${({ theme, color = 'normal' }) => theme.tooltip[color].textColor},
    background-color: ${({ theme, color = 'normal' }) =>
      theme.tooltip[color].backgroundColor},
    font-size: 0.9em,
    font-weight: 400,
    padding: 10px 15px,
    box-shadow: 1px 1px 6px 0px rgba(0,0,0,0.2),
  }
  .tooltip-arrow-default {
    ${({ theme, color = 'normal' }) => theme.tooltip[color].backgroundColor}
  }
`;
