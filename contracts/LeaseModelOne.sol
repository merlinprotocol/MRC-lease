// SPDX-License-Identifier: MIT
// contracts/LeaseModelOne.sol
pragma solidity ^0.8.0;

import "./ILeaseModel.sol";

contract LeaseModelOne is ILeaseModel {
    uint256 public immutable baseRate;
    uint256 public multplier;

    constructor(uint256 _baseRate, uint256 _multplier) {
        baseRate = _baseRate;
        multplier = _multplier;
    }

    /**
      @inheritdoc ILeaseModel
     */
    function calcLeaseCost(uint256 supply, uint256 leaseTerm)
        external
        view
        override
        returns (uint256)
    {
        return baseRate + (multplier * supply) / (supply + leaseTerm);
    }
}
