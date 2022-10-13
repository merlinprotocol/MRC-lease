import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Alert, { AlertColor } from '@mui/material/Alert';
import { useEthers, TransactionStatus } from '@usedapp/core';
import { MetamaskFoxIcon } from '@/components/icons/index';

import {
  useContractFunctionByName,
  usePendingProfit,
  useMarginLeft,
  useCallLease,
  useCallSupply,
  useCallRedeem,
  useCallCancelLease,
} from '@/actions/lease-pool';

const handleState = (
  state: TransactionStatus,
  callback: Dispatch<
    SetStateAction<{
      severity: AlertColor;
      open: boolean;
      message: string;
    }>
  >,
) => {
  switch (state.status) {
    case 'Exception':
      callback({
        severity: 'error',
        open: true,
        message: state.errorMessage || 'Failed',
      });
      break;

    case 'Success':
      callback({
        severity: 'success',
        open: true,
        message: state.errorMessage || 'Success',
      });
      break;
  }
};

export default function Lease() {
  const { account, activateBrowserWallet } = useEthers();
  const [tokenId, setTokenId] = useState('1');
  const [shares, setShares] = useState(100);
  const [period, setPeriod] = useState(200);
  const [notify, setNotify] = useState<{ severity: AlertColor; open: boolean; message: string }>({
    severity: 'info',
    open: false,
    message: '',
  });

  const pendingProfit = usePendingProfit();
  const marginLeft = useMarginLeft();

  const { send: callSupply, supplyState } = useCallSupply();
  const { send: callLease, approveState, leaseState } = useCallLease();
  const { send: claimSupplyProfit, state: claimSupplyProfitState } = useContractFunctionByName('claimSupplyProfit');
  const { send: callCancelLease, state: cancelLeaseState } = useCallCancelLease();
  const { send: callReddem, state: reddemState } = useCallRedeem();

  useEffect(() => {
    handleState(supplyState, setNotify);
  }, [supplyState]);

  useEffect(() => {
    handleState(approveState, setNotify);
  }, [approveState]);

  useEffect(() => {
    handleState(leaseState, setNotify);
  }, [leaseState]);

  useEffect(() => {
    handleState(claimSupplyProfitState, setNotify);
  }, [claimSupplyProfitState]);

  useEffect(() => {
    handleState(cancelLeaseState, setNotify);
  }, [cancelLeaseState]);

  useEffect(() => {
    handleState(reddemState, setNotify);
  }, [reddemState]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          bgcolor: '#fff',
          padding: '12px',
          color: '#666',
        }}
      >
        {account ? (
          <>
            <Typography variant="h6" component="h2">
              Account:
            </Typography>
            <Typography gutterBottom>{account}</Typography>
          </>
        ) : (
          <Button size="small" variant="outlined" startIcon={<MetamaskFoxIcon />} onClick={activateBrowserWallet}>
            Connect Wallet
          </Button>
        )}

        <Typography variant="h6" component="h2" gutterBottom>
          1、Supply
        </Typography>
        <TextField
          value={tokenId}
          type="text"
          label="Token id"
          variant="outlined"
          fullWidth
          onChange={(e) => setTokenId(e.target.value)}
        />

        <LoadingButton
          loading={supplyState.status === 'PendingSignature' || supplyState.status === 'Mining'}
          loadingIndicator={supplyState.status}
          size="large"
          sx={{ marginTop: 2 }}
          fullWidth
          variant="contained"
          onClick={() => callSupply(tokenId)}
        >
          Supply
        </LoadingButton>
      </Box>

      <Box
        sx={{
          bgcolor: '#fff',
          padding: '12px',
          color: '#666',
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          2、pendingProfit
        </Typography>
        <Typography variant="h6" component="h2" gutterBottom>
          {pendingProfit} ETH
        </Typography>
      </Box>

      <Box
        sx={{
          bgcolor: '#fff',
          padding: '12px',
          color: '#666',
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          3、setShares
        </Typography>

        <TextField
          type="number"
          value={shares}
          label="Shares"
          variant="outlined"
          fullWidth
          onChange={(e) => setShares(Number(e.target.value))}
        />

        <TextField
          sx={{ marginTop: 2 }}
          type="number"
          value={period}
          label="Period"
          variant="outlined"
          fullWidth
          onChange={(e) => setPeriod(Number(e.target.value))}
        />

        <LoadingButton
          loading={
            approveState.status === 'PendingSignature' ||
            approveState.status === 'Mining' ||
            leaseState.status === 'PendingSignature' ||
            leaseState.status === 'Mining'
          }
          loadingIndicator={approveState.status === 'Success' ? leaseState.status : 'Approve...'}
          size="large"
          sx={{ marginTop: 2 }}
          fullWidth
          variant="contained"
          onClick={() => callLease(shares, period)}
        >
          Lease
        </LoadingButton>
      </Box>

      <Box
        sx={{
          bgcolor: '#fff',
          padding: '12px',
          color: '#666',
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          4、claim
        </Typography>

        <LoadingButton
          loading={claimSupplyProfitState.status === 'PendingSignature' || claimSupplyProfitState.status === 'Mining'}
          loadingIndicator={claimSupplyProfitState.status}
          size="large"
          sx={{ marginTop: 2 }}
          fullWidth
          variant="contained"
          onClick={() => claimSupplyProfit()}
        >
          Claim Supply Profit
        </LoadingButton>
      </Box>

      <Box
        sx={{
          bgcolor: '#fff',
          padding: '12px',
          color: '#666',
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          5、cancel lease
        </Typography>

        <LoadingButton
          loading={cancelLeaseState.status === 'PendingSignature' || cancelLeaseState.status === 'Mining'}
          loadingIndicator={cancelLeaseState.status}
          size="large"
          sx={{ marginTop: 2 }}
          fullWidth
          variant="contained"
          onClick={() => callCancelLease()}
        >
          cancel lease
        </LoadingButton>
      </Box>

      <Box
        sx={{
          bgcolor: '#fff',
          padding: '12px',
          color: '#666',
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          6、callReddem
        </Typography>

        <LoadingButton
          loading={reddemState.status === 'PendingSignature' || reddemState.status === 'Mining'}
          loadingIndicator={reddemState.status}
          size="large"
          sx={{ marginTop: 2 }}
          fullWidth
          variant="contained"
          onClick={() => callReddem(tokenId)}
        >
          redeem
        </LoadingButton>
      </Box>

      <Box
        sx={{
          bgcolor: '#fff',
          padding: '12px',
          color: '#666',
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          7、marginLeft
        </Typography>

        <Typography gutterBottom>{marginLeft}</Typography>
      </Box>

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={notify.open}
        autoHideDuration={3000}
        onClose={() =>
          setNotify({
            ...notify,
            open: false,
          })
        }
      >
        <Alert severity={notify.severity} sx={{ width: '100%' }}>
          {notify.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
