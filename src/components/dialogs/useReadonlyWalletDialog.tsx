import { Modal } from '@mui/material';
import { ActionButton } from '@libs/neumorphism-ui/components/ActionButton';
import { Dialog } from '@libs/neumorphism-ui/components/Dialog';
import { NativeSelect } from '@libs/neumorphism-ui/components/NativeSelect';
import { TextInput } from '@libs/neumorphism-ui/components/TextInput';
// import { ReadonlyWalletSession } from '@terra-money/wallet-provider';
import { DialogProps, OpenDialog, useDialog } from '@libs/use-dialog';
import { AccAddress } from '@terra-money/feather.js';
import React, {
  ReactNode,
} from 'react';
import styled from 'styled-components';
import { useFormik } from 'formik';
import * as yup from 'yup'
import { CavernNetworkInfo } from '@anchor-protocol/app-provider';

interface FormParams {
  className?: string;
  networks: CavernNetworkInfo[]
}

type FormReturn = {
  address: string,
  chainID: string
} | null;

export function useReadonlyWalletDialog(): [
  OpenDialog<FormParams, FormReturn>,
  ReactNode,
] {
  return useDialog(Component);
}

const validationSchema = yup.object({
  address: yup.string().required('You have to provide an address to impersonate').test("test-is-address", "Please enter a valid Terra Address", (address) => {
    console.log(address)
    return AccAddress.validate(address)
  }),
})

function ComponentBase({
  className,
  networks,
  closeDialog,
}: DialogProps<FormParams, FormReturn>) {

  const formik = useFormik({
    initialValues: {
      address: '',
      chainID: '',
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      closeDialog({
        address: values.address,
        chainID: values.chainID
      })
    },
  })

  return (
    <Modal open onClose={() => closeDialog(null)}>
      <Dialog className={className} onClose={() => closeDialog(null)}>

        <form onSubmit={(event) => {
          event.preventDefault();
          formik.handleSubmit()
        }}>
          <h1>View an Address</h1>

          {/* Network */}
          <div className="network-description">
            <p>Network</p>
            <p />
          </div>

          <NativeSelect
            fullWidth
            value={formik.values.chainID}
            id="chainID"
            type="chainID"
            name="chainID"
            className="chainID"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.chainID &&
              Boolean(formik.errors.chainID)
            }
          >
            {networks.map(({ chainID, name }) => (
              <option key={chainID} value={chainID}>
                {name} ({chainID})
              </option>
            ))}
          </NativeSelect>

          {/* Address */}
          <div className="address-description">
            <p>Wallet Address</p>
            <p />
          </div>

          <TextInput
            id="address"
            type="address"
            name="address"
            className="address"
            fullWidth
            placeholder="ADDRESS" value={formik.values.address}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.address &&
              Boolean(formik.errors.address)
            }
            helperText={
              formik.touched.address &&
              formik.errors.address
            }
          />

          <ActionButton
            className="connect"
            disabled={formik.touched.address && !!formik.errors.address}
            type="submit"
          >
            View
          </ActionButton>
        </form>
      </Dialog>
    </Modal>
  );
}

const Component = styled(ComponentBase)`
  width: 720px;

  h1 {
    font-size: 27px;
    text-align: center;
    font-weight: 300;
    margin-bottom: 50px;
  }

  .address-description,
  .network-description {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: ${({ theme }) => theme.textColor};

    > :last-child {
      font-size: 12px;
    }

    margin-bottom: 12px;
  }

  .address-description {
    margin-top: 24px;
  }

  .connect {
    margin-top: 40px;
    width: 100%;
    height: 60px;
  }
`;
