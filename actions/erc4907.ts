import { Contract } from 'ethers';
import { useEthers, useContractFunction, useCall, useCalls, Falsy, Call, addressEqual } from '@usedapp/core';
import ERC4907Art from '@/artifacts/contracts/MockERC4907.sol/MockERC4907.json';

const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS as string;
const POOL_ADDRESS = process.env.NEXT_PUBLIC_POOL_ADDRESS as string;

export function useContract() {
  const { account, library } = useEthers();
  return new Contract(NFT_ADDRESS, ERC4907Art.abi, library?.getSigner(account).connectUnchecked());
}

export function useContractFunctionByName(functionName: string) {
  const contract = useContract();
  return useContractFunction(contract, functionName);
}

// useCall
export function useIsApprovedForAll(): boolean {
  const { account } = useEthers();
  const contract = useContract();

  const { value, error } =
    useCall(
      account && {
        contract: contract,
        method: 'isApprovedForAll',
        args: [account, POOL_ADDRESS],
      },
    ) ?? {};

  if (error) {
    console.error(error.message);
    return false;
  }
  return value?.[0];
}

export function useNextId(): number {
  const contract = useContract();

  const { value, error } =
    useCall({
      contract: contract,
      method: 'nextId',
      args: [],
    }) ?? {};

  if (!value || error) {
    return 1;
  }
  return value?.[0].toNumber();
}

export function useTokenIdsOwner(): string[] {
  const contract = useContract();
  const nextId = useNextId();
  const calls: Call<Contract, string>[] = [];

  const len = nextId - 1 <= 5 ? nextId - 1 : 5;
  for (let i = 1; i <= len; i++) {
    calls.push({
      contract: contract,
      method: 'ownerOf',
      args: [i],
    });
  }

  const results = useCalls(calls) ?? [];
  results.forEach((result, idx) => {
    if (result && result.error) {
      console.error(
        `Error encountered calling 'totalSupply' on ${calls[idx]?.contract.address}: ${result.error.message}`,
      );
    }
  });

  return results.map((result) => result?.value?.[0]);
}

export function useOwnerTokenIds(): number[] {
  const { account } = useEthers();
  const tokenIdsOwner = useTokenIdsOwner();

  const ownerIds: number[] = [];
  tokenIdsOwner.forEach((owner, idx) => {
    if (owner && account && addressEqual(owner, account)) {
      ownerIds.push(idx + 1);
    }
  });

  return ownerIds;
}

export function useTokenMetadata(id: number | string) {
  const metadata = {
    description: 'Merlin Protocol:a leading NFTFi infrastructure liquidity protocol.',
    image: `/nft/nft-${id}.gif`,
    name: `NFT#${id}`,
  };

  return metadata;
}
