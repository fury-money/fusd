import { useDeploymentTarget } from '@anchor-protocol/app-provider';
import { useMemo } from 'react';

export interface RouteMenu {
  to: string;
  title: string;
}

const dashboard: RouteMenu = {
  to: '/',
  title: 'DASHBOARD',
};

const myPage: RouteMenu = {
  to: `/mypage`,
  title: 'MY PAGE',
};

const earn: RouteMenu = {
  to: '/earn',
  title: 'EARN',
};

const borrow: RouteMenu = {
  to: '/borrow',
  title: 'BORROW',
};

const bAsset: RouteMenu = {
  to: '/aasset',
  title: 'aASSET',
};

const liquidation: RouteMenu = {
  to: '/liquidation',
  title: 'LIQUIDATE',
};

const useMenus = (): RouteMenu[] => {
  const {
    target: { isEVM },
  } = useDeploymentTarget();
  return useMemo(() => {
    if (isEVM) {
      return [dashboard, myPage, earn, borrow];
    }
    return [dashboard, myPage, earn, borrow, bAsset, liquidation];
  }, [isEVM]);
};

export { useMenus };
