import { ButtonBase, ButtonBaseTypeMap, ExtendButtonBase } from '@mui/material';
import { flat, pressed } from '@libs/styled-neumorphism';
import styled from 'styled-components';
import { buttonBaseStyle } from './ActionButton';

/**
 * Styled component of the `<ButtonBase />` of the Material-UI
 *
 * @see https://material-ui.com/api/button-base/
 */
export const EmbossButton: ExtendButtonBase<
  ButtonBaseTypeMap<{}, 'a'>
> = styled(ButtonBase)`
  ${buttonBaseStyle};

  border-radius: 5px;

  color: ${({ theme }) => theme.textColor};

  ${({ theme }) =>
    flat({
      color: theme.selector.backgroundColor,
      backgroundColor: theme.backgroundColor,
      distance: 1,
      intensity: theme.intensity,
    })};

  &:active {
    ${({ theme }) =>
      pressed({
        color: theme.selector.backgroundColor,
        backgroundColor: theme.backgroundColor,
        distance: 1,
        intensity: theme.intensity,
      })};
  }

  &:disabled {
    opacity: 0.3;
  }
`;
