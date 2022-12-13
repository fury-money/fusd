import { softPressed } from '@libs/styled-neumorphism';
import { TextField, TextFieldProps } from '@mui/material';
import styled from 'styled-components';
import React from 'react';

export type TextInputProps = TextFieldProps & {
  disableBorder?: boolean;
  readOnly?: boolean;
};

const TextInputBase: React.FC<TextInputProps> = ({
  disableBorder,
  ...props
}: TextInputProps) => {
  return <TextField {...props} />;
};

/**
 * Styled component of the `<TextField/>` of the Material-UI
 *
 * @see https://material-ui.com/api/text-field/
 */
export const TextInput = styled(TextInputBase)`
  & {
    border-radius: 5px;
    ${({ theme, readOnly, disableBorder }) =>
      !disableBorder &&
      softPressed({
        color: readOnly
          ? theme.sectionBackgroundColor
          : theme.textInput.backgroundColor,
        backgroundColor: theme.sectionBackgroundColor,
        distance: 1,
        intensity: theme.intensity * 2,
      })};

    :has(.MuiInputLabel-shrink) {
      box-shadow: none;
    }

    ,
    .MuiFormLabel-root {
      opacity: 1;
      color: ${({ theme }) => theme.formControl.labelColor};
    }

    .MuiFormLabel-root.Mui-focused {
      opacity: 1;
      color: ${({ theme }) => theme.formControl.labelFocusedColor};
    }

    .MuiFormLabel-root.Mui-error {
      color: ${({ theme }) => theme.formControl.labelErrorColor};
    }

    .MuiInput-root {
      margin: 14px 20px;
      color: ${({ theme }) => theme.textInput.textColor};
    }

    .MuiInput-root.MuiInput-fullWidth {
      width: auto;
    }

    .MuiInput-root.Mui-error {
      color: ${({ theme }) => theme.formControl.labelErrorColor};
    }

    .MuiInputAdornment-root > .MuiTypography-root {
      color: ${({ theme }) => theme.textInput.textColor};
    }

    .MuiInput-underline:before,
    .MuiInput-underline:after {
      display: none;
    }

    .MuiFormHelperText-root {
      position: absolute;
      right: 0;
      bottom: -20px;
    }

    ${({ disabled }) => (disabled ? 'opacity: 0.5' : '')};

    .Mui-disabled {
      opacity: 0.5;
    }
  }
` as any;
