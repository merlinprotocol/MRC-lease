// SPDX-License-Identifier: MIT
// contracts/ILeaseModel.sol
pragma solidity ^0.8.0;

interface ILeaseModel {
    // Rent cost calculation model
    function calcLeaseCost(uint256 supply, uint256 leaseTerm)
        external
        view
        returns (uint256);
}
