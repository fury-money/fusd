import { PollingTimeout, TxErrorRendering } from '@libs/app-fns';
// import {
//   CreateTxFailed,
//   Timeout,
//   TxFailed,
//   TxUnspecifiedError,
//   UserDenied,
// } from '@terra-money/wallet-provider';
import React, { ReactNode } from 'react';

// ----------------------------------------------------------------
// parse error
// ----------------------------------------------------------------
const channels = (
  <ul>
    <li>
      Github Issues :{' '}
      <a
        href="https://github.com/CavernPerson/webapp//issues"
        target="_blank"
        rel="noreferrer"
      >
        https://github.com/CavernPerson/webapp/
      </a>
    </li>
  </ul>
);

const createTxFailedMessage = (message: string) => (
  <div style={{ lineHeight: '1.8em' }}>
    <p>{message}</p>
    <p style={{ opacity: 0.7 }}>
      If you are using multiple wallets, please retry after refreshing the
      WebApp.
    </p>
    <p style={{ opacity: 0.7 }}>
      If the problem still persists, please report the issue to admin through
      any one of the following channels.
    </p>

    {channels}
  </div>
);

const txUnspecifiedErrorMessage = (message: string | undefined | null) => (
  <div style={{ lineHeight: '1.8em' }}>
    {typeof message === 'string' && <p>{message}</p>}
    <p style={{ opacity: typeof message === 'string' ? 0.7 : undefined }}>
      If you are using multiple wallets, please retry after refreshing the
      WebApp.
    </p>
    <p style={{ opacity: typeof message === 'string' ? 0.7 : undefined }}>
      If the problem still persists, please report the issue to admin through
      any one of the following channels.
    </p>

    {channels}
  </div>
);

const uncaughtErrorMessage = (message: string | null | undefined) => (
  <div style={{ lineHeight: '1.8em' }}>
    {typeof message === 'string' && <p>{message}</p>}
    <p style={{ opacity: typeof message === 'string' ? 0.7 : undefined }}>
      If the problem still persists, please report the issue to admin through
      any one of the following channels.
    </p>

    {channels}
  </div>
);

function instanceofWithName<E>(error: unknown, name: string): error is E {
  return error instanceof Error && error.name === name;
}

export function renderTxFailedReason({
  error,
  errorId,
}: TxErrorRendering): ReactNode {

  // // @terra-money/wallet-provider
  // if (
  //   error instanceof UserDenied ||
  //   instanceofWithName<UserDenied>(error, 'UserDenied')
  // ) {
  //   return <h2>User Denied</h2>;
  // } else if (
  //   error instanceof CreateTxFailed ||
  //   instanceofWithName<CreateTxFailed>(error, 'CreateTxFailed')
  // ) {
  //   return (
  //     <>
  //       <h2>Failed to broadcast transaction</h2>
  //       <ErrorMessageView error={error} errorId={errorId}>
  //         {createTxFailedMessage(error.message)}
  //       </ErrorMessageView>
  //     </>
  //   );
  // } else if (
  //   error instanceof TxFailed ||
  //   instanceofWithName<TxFailed>(error, 'TxFailed')
  // ) {
  //   return (
  //     <>
  //       <h2>Transaction failed</h2>
  //     </>
  //   );
  // } else if (
  //   error instanceof Timeout ||
  //   instanceofWithName<Timeout>(error, 'Timeout')
  // ) {
  //   return (
  //     <>
  //       <h2>Timeout</h2>
  //       <div style={{ marginBottom: '1em' }}>{error.message}</div>
  //     </>
  //   );
  // } else if (
  //   error instanceof PollingTimeout ||
  //   instanceofWithName<PollingTimeout>(error, 'PollingTimeout')
  // ) {
  //   return (
  //     <>
  //       <h2>Transaction Queued</h2>
  //       <div style={{ marginBottom: '1em' }}>{error.message}</div>
  //     </>
  //   );
  // } else if (
  //   error instanceof TxUnspecifiedError ||
  //   instanceofWithName<TxUnspecifiedError>(error, 'TxUnspecifiedError')
  // ) {
  //   return (
  //     <>
  //       <h2>Transaction failed (unspecified)</h2>
  //       <ErrorMessageView error={error} errorId={errorId}>
  //         {txUnspecifiedErrorMessage(error.message)}
  //       </ErrorMessageView>
  //     </>
  //   );
  // }
  return (
    <>
      <h2>Oops, something went wrong!</h2>
      <ErrorMessageView error={error} errorId={errorId}>
        {uncaughtErrorMessage(
          error instanceof Error ? error.message : String(error),
        )}
      </ErrorMessageView>
    </>
  );
}

function ErrorMessageView({
  children,
  error,
  errorId,
}: {
  children: ReactNode;
  error: unknown;
  errorId?: string | null;
}) {
  return (
    <div>
      {error instanceof Error && error.message.length > 0 ? (
        <div style={{ lineHeight: '1.8em' }}>
          <details>
            <summary>{error.message}</summary>
            <ul style={{ fontSize: '0.8em' }}>
              <li>Error type: {error.name}</li>
              <li>Error stack: {error.stack}</li>
            </ul>
          </details>
        </div>
      ) : (
        children
      )}
      {/*{!(error instanceof Error && error.message.length > 0) && errorId && (*/}
      {/*  <p>*/}
      {/*    <b>Error ID</b>: {errorId}*/}
      {/*  </p>*/}
      {/*)}*/}
    </div>
  );
}
