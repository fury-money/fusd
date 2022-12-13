import { ButtonBase, ButtonBaseTypeMap, ExtendButtonBase } from '@mui/material';
import styled from 'styled-components';
import { buttonBaseStyle } from './ActionButton';

/**
 * Styled component of the `<ButtonBase />` of the Material-UI
 *
 * @see https://material-ui.com/api/button-base/
 */
export const FlatButton: ExtendButtonBase<
  ButtonBaseTypeMap<{}, 'button'>
> = styled(ButtonBase).attrs({ disableRipple: true })`
  ${buttonBaseStyle};
  && {
    background-color: ${({ theme }) => theme.actionButton.backgroundColor};

    &:hover {
      background-color: ${({ theme }) =>
        theme.actionButton.backgroundHoverColor};
    }

    &:disabled {
      opacity: 0.3;
    }
  }
`;
