import { FunctionComponent, ReactNode } from 'react';
import { useMediaQuery } from 'react-responsive';

interface LayoutSwitchProps {
  desktop: FunctionComponent | ReactNode;
  mobile: FunctionComponent | ReactNode;
}

export const LayoutSwitch = (props: LayoutSwitchProps): React.JSX.Element => {
  const { desktop, mobile } = props;

  const isMobile = useMediaQuery({ maxWidth: 900 });

  let content: ReactNode | FunctionComponent;

  if (isMobile) {
    content = mobile;
  } else {
    content = desktop;
  }

  return (typeof content === 'function' ? content({}) : desktop) as React.JSX.Element;
};
