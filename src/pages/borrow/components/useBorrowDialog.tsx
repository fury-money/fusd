import React from 'react';
import { useDialog, DialogProps, OpenDialog } from '@libs/use-dialog';
import { DeploymentSwitch } from 'components/layouts/DeploymentSwitch';
import type { ReactNode } from 'react';
import { TerraBorrowDialog } from './terra/TerraBorrowDialog';
import { BorrowFormParams } from './types';

function Component(props: DialogProps<BorrowFormParams>) {
  return (
    <DeploymentSwitch
      terra={<TerraBorrowDialog {...props} />}
    />
  );
}

export function useBorrowDialog(): [OpenDialog<BorrowFormParams>, ReactNode] {
  return useDialog<BorrowFormParams>(Component);
}
