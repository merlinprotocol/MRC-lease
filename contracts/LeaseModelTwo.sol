// SPDX-License-Identifier: MIT
// contracts/LeaseModelTwo.sol
pragma solidity ^0.8.0;

import "./ILeaseModel.sol";

contract LeaseModelTwo is ILeaseModel {
    uint256 public immutable multplier0;
    uint256 public immutable multplier1;

    constructor(uint256 _multplier0, uint256 _multplier1) {
        multplier0 = _multplier0;
        multplier1 = _multplier1;
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
        uint256 p = (supply * 1e18) / (supply + leaseTerm);
        if (p < 8e15) {
            return (multplier0 * p) / 1e18;
        } else {
            return
                (multplier0 * 8e15) / 1e18 + (multplier1 * (p - 8e15)) / 1e18;
        }
    }
}
