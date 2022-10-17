import { Contract } from "ethers";
import { useEthers, useContractFunction, useCall } from "@usedapp/core";
import ERC4907Art from "@/artifacts/contracts/MockERC4907.sol/MockERC4907.json";

const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS as string;
const POOL_ADDRESS = process.env.NEXT_PUBLIC_POOL_ADDRESS as string;

export function useContract() {
  const { account, library } = useEthers();
  return new Contract(
    NFT_ADDRESS,
    ERC4907Art.abi,
    library?.getSigner(account).connectUnchecked()
  );
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
        method: "isApprovedForAll",
        args: [account, POOL_ADDRESS],
      }
    ) ?? {};

  if (error) {
    console.error(error.message);
    return false;
  }
  return value?.[0];
}
