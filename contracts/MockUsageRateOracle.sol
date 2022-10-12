// SPDX-License-Identifier: MIT
// contracts/MockUsageRateOracle.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IUsageRateOracle.sol";

contract MockUsageRateOracle is IUsageRateOracle, Ownable {
    address private nft_;

    mapping(uint256 => uint256) private usageRates_;

    constructor(address _nft) {
        nft_ = _nft;
        usageRates_[0] = 10;
        usageRates_[1] = 100;
        usageRates_[2] = 500;
        usageRates_[3] = 1000;
        usageRates_[4] = 2000;
    }

    function usageRateOf(uint256 tokenId) external override view returns (uint256) {
        uint256 rate = usageRates_[tokenId];
        return rate == 0 ? 1 : rate;
    }

    function nft() external override view returns (address) {
        return nft_;
    }
}
