// SPDX-License-Identifier: MIT
// contracts/IVault.sol
pragma solidity ^0.8.0;

interface IVault {
    /**
        @dev withdraw the nft
        @notice administrator permissions are required
     */
    function withdraw(
        address nft,
        uint256 tokenId,
        address to
    ) external;
}
