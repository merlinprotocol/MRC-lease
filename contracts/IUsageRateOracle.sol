// SPDX-License-Identifier: MIT
// contracts/IUsageRateOracle.sol
pragma solidity ^0.8.0;

interface IUsageRateOracle {
    /**
     * @dev Returns the usage rate of nft by `tokenId`.
     */
    function usageRateOf(uint256 tokenId) external view returns (uint256);

    /**
     * @dev Returns the estimated NFT address.
     */
    function nft() external view returns (address);
}
