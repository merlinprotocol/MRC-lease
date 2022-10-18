import { Contract, ethers, utils, BigNumber } from 'ethers';
import { useEthers, useContractFunction, useCall } from '@usedapp/core';
import LeasePoolArt from '@/artifacts/contracts/LeasePool.sol/LeasePool.json';
import { useContractFunctionByName as useUSDTContractFunctionByName } from './usdt';
import { useIsApprovedForAll, useContractFunctionByName as useNFTContractFunctionByName } from './erc4907';

const POOL_ADDRESS = process.env.NEXT_PUBLIC_POOL_ADDRESS as string;
const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS as string;

export function useContract() {
  const { account, library } = useEthers();
  return new Contract(POOL_ADDRESS, LeasePoolArt.abi, library?.getSigner(account).connectUnchecked());
}

export function useContractFunctionByName(functionName: string) {
  const contract = useContract();
  return useContractFunction(contract, functionName);
}

// useCall
// ==========================
export function usePendingProfit(): string {
  const { account } = useEthers();
  const contract = useContract();

  const { value, error } =
    useCall(
      account && {
        contract: contract,
        method: 'pendingProfit',
        args: [account],
      },
    ) ?? {};

  if (error) {
    console.error(error.message);
    return '0';
  }
  return utils.formatEther(value?.[0] || 0);
}

export function useMarginLeft(): string {
  const { account } = useEthers();
  const contract = useContract();

  const { value, error } =
    useCall(
      account && {
        contract: contract,
        method: 'marginLeft',
        args: [account],
      },
    ) ?? {};

  if (error) {
    console.error(error.message);
    return '0';
  }
  return utils.formatEther(value?.[0] || 0);
}

export function useGetLeasePrice(_supplyAmount: string | number, _leaseAmount: string | number): BigNumber | undefined {
  const contract = useContract();

  const { value, error } =
    useCall({
      contract: contract,
      method: 'getLeasePrice',
      args: [_supplyAmount, _leaseAmount], // TODO check params is valid
    }) ?? {};

  if (error) {
    console.error(error.message);
    return BigNumber.from(0);
  }
  return value?.[0];
}
export function useGetLeasePriceUI(_supplyAmount: string | number, _leaseAmount: string | number): string {
  const leasePrice = useGetLeasePrice(_supplyAmount, _leaseAmount);
  return utils.formatEther(leasePrice || 0);
}

export function useTotalSupply(): BigNumber | undefined {
  const contract = useContract();

  const { value, error } =
    useCall({
      contract: contract,
      method: 'totalSupply',
      args: [],
    }) ?? {};

  if (error) {
    console.error(error.message);
    return BigNumber.from(0);
  }
  return value?.[0];
}

export function useTotalLeaseAmount(): BigNumber | undefined {
  const contract = useContract();

  const { value, error } =
    useCall({
      contract: contract,
      method: 'totalLeaseAmount',
      args: [],
    }) ?? {};

  if (error) {
    console.error(error.message);
    return BigNumber.from(0);
  }
  return value?.[0];
}

//
// ==================
export function useCallLease() {
  const { send: usdtApprove, state: approveState } = useUSDTContractFunctionByName('approve');
  const { send: lease, state: leaseState } = useContractFunctionByName('lease');

  const callLease = async (shares: number, period: number) => {
    const tx = await usdtApprove(POOL_ADDRESS, ethers.constants.MaxInt256);

    if (tx) {
      return await lease(utils.parseEther(String(shares)).toString(), period);
    }
  };

  return {
    approveState,
    leaseState,
    send: callLease,
  };
}

export function useCallSupply() {
  const isApprovedForAll = useIsApprovedForAll();
  const { send: setApprovalForAll, state: approvalState } = useNFTContractFunctionByName('setApprovalForAll');
  const { send: supply, state: supplyState } = useContractFunctionByName('supply');

  const callSupply = async (tokenId: string | number) => {
    if (!isApprovedForAll) {
      await setApprovalForAll(POOL_ADDRESS, true);
    }

    return await supply([NFT_ADDRESS], [tokenId]);
  };

  return {
    approvalState,
    supplyState,
    send: callSupply,
  };
}

export function useCallRedeem() {
  const { send: redeem, state } = useContractFunctionByName('redeem');

  const callReddem = async (tokenId: string | number) => {
    return await redeem([NFT_ADDRESS], [tokenId]);
  };

  return {
    state,
    send: callReddem,
  };
}

export function useCallCancelLease() {
  const { send: lease, state } = useContractFunctionByName('lease');

  const callCancelLease = async () => {
    return await lease(0);
  };

  return {
    state,
    send: callCancelLease,
  };
}

// 8. rental yield perblock
// let leaseRate = await pool.getLeasePrice(0)
// const totalSupply = await pool.totalSupply()
// const totalLeaseAmount = await pool.totalLeaseAmount()
// const rental_yield_perblock = leaseRate.mul(totalLeaseAmount).div(totalSupply)
export function useRentalYieldPerblock(): BigNumber {
  const leaseRate = useGetLeasePrice(0, 0);
  const totalSupply = useTotalSupply();
  const totalLeaseAmount = useTotalLeaseAmount();

  // console.log({ leaseRate, totalSupply, totalLeaseAmount });
  if (!leaseRate || !totalSupply || !totalLeaseAmount || totalSupply.isZero()) return BigNumber.from(0);

  return leaseRate.mul(totalLeaseAmount).div(totalSupply);
}
export function useRentalYieldPerblockUI(): String {
  const rentalYieldPerblock = useRentalYieldPerblock();
  return utils.formatEther(rentalYieldPerblock);
}

// 13 Rent Out: change rental yield perblock
export function useRentChangeYield(supplyAmount: number | string) {
  const _supplyAmount = utils.parseEther(String(supplyAmount));
  const leaseRate = useGetLeasePrice(_supplyAmount.toString(), 0);

  return leaseRate;
}
export function useRentChangeYieldUI(supplyAmount: number | string): string {
  const rentChangeYield = useRentChangeYield(supplyAmount);

  return utils.formatEther(rentChangeYield || 0);
}
