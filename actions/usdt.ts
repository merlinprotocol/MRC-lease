import { Contract } from 'ethers';
import { useEthers, useContractFunction } from '@usedapp/core';
import ERC20ABI from '@/abis/ERC20.json';

const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS as string;

// contract
// ======================
export function useContract() {
  const { account, library } = useEthers();
  return new Contract(USDT_ADDRESS, ERC20ABI, library?.getSigner(account).connectUnchecked());
}

// useContractFunction
// =======================
export function useContractFunctionByName(functionName: string) {
  const contract = useContract();

  return useContractFunction(contract, functionName);
}
