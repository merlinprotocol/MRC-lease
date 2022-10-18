import * as React from 'react';
import Image from 'next/image';
import AppBar from '@mui/material/AppBar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import Slider from '@mui/material/Slider';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert, { AlertColor } from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import { styled } from '@mui/material/styles';

import { utils } from 'ethers';
import { useEthers, shortenAddress, TransactionStatus } from '@usedapp/core';
import { MetamaskFoxIcon } from '@/components/icons/index';

import {
  useContractFunctionByName,
  usePendingProfit,
  useMarginLeft,
  useCallLease,
  useCallSupply,
  useCallRedeem,
  useCallCancelLease,
  useRentalYieldPerblockUI,
  useGetLeasePriceUI,
  useTotalSupply,
  useTotalLeaseAmount,
  useRentChangeYieldUI,
} from '@/actions/lease-pool';
import { useOwnerTokenIds, useTokenMetadata } from '@/actions/erc4907';
import styles from './index.module.scss';

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

interface StyledTabsProps {
  children?: React.ReactNode;
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const appBox = {
  display: 'flex',
  justifyContent: 'center',
  mt: '46px',
};
const appContentBox = {
  width: 500,
  bgcolor: '#191b1f',
  borderRadius: 6,
  overflow: 'hidden',
};

const rowBox = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  color: 'text.primary',
  mt: 1,
};

const tabpanelBox = {
  padding: 2,
};

const StyledTabs = styled((props: StyledTabsProps) => (
  <Tabs {...props} TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" /> }} />
))({
  '& .MuiTabs-scroller': {
    textAlign: 'center',
  },
  '& .MuiTabs-flexContainer': {
    display: 'inline-block',
    backgroundColor: 'rgb(25 27 31)',
    color: '#c3c5cb',
    borderRadius: '16px',
  },
  '& .MuiButtonBase-root': {
    color: '#c3c5cb',
  },
  '& .MuiButtonBase-root.Mui-selected': {
    color: '#fff',
  },
  '& .MuiTabs-indicator': {
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  '& .MuiTabs-indicatorSpan': {
    maxWidth: 40,
    width: '100%',
    backgroundColor: '#635ee7',
  },
});

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
  },
}));

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;

  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={tabpanelBox}>{children}</Box>}
    </div>
  );
}

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="primary">{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

const handleState = (
  state: TransactionStatus,
  callback: React.Dispatch<
    React.SetStateAction<{
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

export default function App() {
  const { account, activateBrowserWallet, deactivate } = useEthers();
  const [value, setValue] = React.useState(0); // setlect nft tokenId
  const [tokenId, setTokenId] = React.useState('');
  const [progress, setProgress] = React.useState(0);
  const ownerTokenIds = useOwnerTokenIds();
  const tokenMetadata = useTokenMetadata(tokenId);

  const [borrowAmount, setBorrowAmount] = React.useState<number | ''>(1);

  const totalSupply = useTotalSupply();
  const totalLeaseAmount = useTotalLeaseAmount();

  const rentalYieldPerblockUI = useRentalYieldPerblockUI();
  const borrowYieldPerblock = useGetLeasePriceUI(0, 0);
  const borrowChangedYield = useGetLeasePriceUI(0, utils.parseEther(String(borrowAmount || 0)).toString());
  const rentChangeedYield = useRentChangeYieldUI(100);

  const [notify, setNotify] = React.useState<{
    severity: AlertColor;
    open: boolean;
    message: string;
  }>({
    severity: 'info',
    open: false,
    message: '',
  });

  const { send: callSupply, supplyState } = useCallSupply();
  const { send: callLease, approveState, leaseState } = useCallLease();

  React.useEffect(() => {
    handleState(supplyState, setNotify);
  }, [supplyState]);
  React.useEffect(() => {
    handleState(leaseState, setNotify);
  }, [leaseState]);

  React.useEffect(() => {
    setTokenId('');
  }, [account]);

  React.useEffect(() => {
    if (totalLeaseAmount && totalSupply && !totalSupply.isZero()) {
      const supply = utils.formatEther(totalSupply);
      const lease = utils.formatEther(totalLeaseAmount);
      // console.log({ supply, lease });
      const _process = (Number(lease) / Number(supply)) * 100;

      setProgress(_process);
    }
  }, [totalSupply, totalLeaseAmount]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleChangeToken = (event: SelectChangeEvent) => {
    setTokenId(event.target.value as string);
  };

  const ConnectWalletButton = (
    <Button
      sx={{
        borderColor: 'primary.main',
        color: 'primary.main',
        borderRadius: '16px',
      }}
      color="inherit"
      size="medium"
      variant="outlined"
      startIcon={<MetamaskFoxIcon />}
      onClick={activateBrowserWallet}
    >
      Connect Wallet
    </Button>
  );

  return (
    <Box>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" style={{ background: 'transparent', boxShadow: 'none' }}>
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2, color: 'primary.main' }}
            >
              MRC Lease
            </IconButton>

            <Box sx={{ flexGrow: 1, justifyContent: 'center' }}>
              {account && (
                <StyledTabs value={value} onChange={handleChange}>
                  <Tab label="Rent" />
                  <Tab label="Borrow" />
                </StyledTabs>
              )}
            </Box>

            {account ? (
              <Chip
                color="primary"
                avatar={<Avatar alt="metamask" src="/images/logo/metamask-fox.svg" />}
                label={shortenAddress(account)}
                variant="outlined"
              />
            ) : null}
          </Toolbar>
        </AppBar>
      </Box>

      {account ? (
        <Box sx={appBox}>
          <Box sx={appContentBox}>
            <TabPanel value={value} index={0}>
              <Box sx={rowBox}>
                <Typography color="#b2b9d2">Rental yield perblock:</Typography>
                <Typography color="#b2b9d2">{rentalYieldPerblockUI} USDT</Typography>
              </Box>

              <Box sx={rowBox}>
                <Typography color="#b2b9d2">Fee:</Typography>
                <Typography color="#b2b9d2">2%</Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                {/* <Slider
                sx={{
                  '& .MuiSlider-markLabel': {
                    color: '#b2b9d2',
                  },
                }}
                defaultValue={50}
                valueLabelDisplay="auto"
                marks={[
                  {
                    value: 0,
                    label: '0%',
                  },
                  {
                    value: 100,
                    label: '100%',
                  },
                ]}
              /> */}

                <LinearProgressWithLabel value={progress} />
              </Box>
              <Box sx={{ ...rowBox, mt: 2 }}>
                <Typography color="#b2b9d2">Change rental yield perblock:</Typography>
                <Typography color="#b2b9d2">{rentChangeedYield} USDT</Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <StyledFormControl fullWidth>
                  <InputLabel
                    sx={{
                      color: 'primary.main',
                    }}
                    id="demo-simple-select-label"
                  >
                    NFT
                  </InputLabel>
                  <Select
                    labelId="demo-simple-select-label"
                    value={tokenId}
                    label="NFT"
                    onChange={handleChangeToken}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },

                      '& .MuiSelect-select': {
                        color: '#b2b9d2',
                      },
                    }}
                  >
                    {ownerTokenIds.length ? (
                      ownerTokenIds.map((id) => (
                        <MenuItem key={id} value={id}>
                          HashNFT #{id}
                        </MenuItem>
                      ))
                    ) : (
                      <Box sx={{ textAlign: 'center' }}>No Data</Box>
                    )}
                  </Select>
                </StyledFormControl>
              </Box>

              {tokenId && tokenMetadata && (
                <Box
                  sx={{
                    width: '100%',
                    height: '400px',
                    position: 'relative',
                    textAlign: 'center',
                    mt: 2,
                  }}
                >
                  <Image src={tokenMetadata.image} layout="fill" objectFit="contain" />
                </Box>
              )}

              <LoadingButton
                disabled={!account}
                loading={supplyState.status === 'PendingSignature' || supplyState.status === 'Mining'}
                loadingIndicator={supplyState.status}
                size="large"
                sx={{ mt: 2 }}
                fullWidth
                variant="contained"
                onClick={() => callSupply(tokenId)}
              >
                Rent
              </LoadingButton>
            </TabPanel>

            <TabPanel value={value} index={1}>
              <Box sx={rowBox}>
                <Typography color="#b2b9d2">Rental yield perblock:</Typography>
                <Typography color="#b2b9d2">{rentalYieldPerblockUI} USDT</Typography>
              </Box>

              <Box sx={{ mt: 2 }}>
                <LinearProgressWithLabel value={progress} />
              </Box>

              <Box sx={rowBox}>
                <TextField
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(Number(e.target.value) || '')}
                  fullWidth
                  label="Amount"
                  variant="outlined"
                  sx={{
                    mt: 2,
                    mb: 2,
                    '& .MuiOutlinedInput-input': {
                      color: '#b2b9d2',
                    },

                    '& .MuiFormLabel-root': {
                      color: 'primary.main',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                  }}
                />
              </Box>

              <Box sx={rowBox}>
                <Box>
                  <Typography color="#b2b9d2" variant="body1" component="span">
                    Period:
                  </Typography>
                  <Typography color="#b2b9d2" variant="body1" component="span">
                    10000 blocks
                  </Typography>
                </Box>

                <Box>
                  <Typography color="#b2b9d2" variant="body1" component="span">
                    Rental:
                  </Typography>
                  <Typography color="#b2b9d2" variant="body1" component="span">
                    1000 USDT
                  </Typography>
                </Box>
              </Box>

              {/* <Box sx={rowBox}>
                <Typography color="#b2b9d2">Mini Margin:</Typography>
                <Typography color="#b2b9d2">47.376 USDT</Typography>
              </Box> */}

              {/* <Button sx={{ mt: 2 }} size="large" fullWidth variant="contained">
                Borrow
              </Button> */}
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
                onClick={() => callLease(Number(borrowAmount), 10000)}
              >
                Lease
              </LoadingButton>

              <Box sx={{ ...rowBox }}>
                <Typography color="#b2b9d2">Change rental yield perblock:</Typography>
                <Typography color="#b2b9d2">{borrowChangedYield} USDT</Typography>
              </Box>
            </TabPanel>

            {account && (
              <Box
                sx={{
                  textAlign: 'center',
                  mt: 4,
                  backgroundColor: 'transparent',
                }}
              >
                <Typography color="#b2b9d2" variant="caption" display="block" gutterBottom>
                  Account: {account}
                </Typography>

                <Button size="small" variant="text" onClick={deactivate}>
                  Disconnect
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        <Box flexGrow={1} sx={{ mt: '200px', textAlign: 'center' }}>
          {ConnectWalletButton}
        </Box>
      )}

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={notify.open}
        autoHideDuration={3000}
        onClose={() => setNotify({ ...notify, open: false })}
      >
        <Alert severity={notify.severity} sx={{ width: '100%' }}>
          {notify.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
