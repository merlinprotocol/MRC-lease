// SPDX-License-Identifier: MIT
// contracts/IPool.sol
pragma solidity ^0.8.0;

struct UserLeaseInfo {
  uint256 share; 
  uint256 height;
  uint256 margin;
  uint256 paid;
  uint256 costPerLeaseShare;
}

struct UserSupplyInfo {
  uint256 share;
}

interface IPool {

    event Supply(address user, address indexed nft, uint256 tokenId, uint256 _share);

    event Redeem(address user, uint256 amount);

    event Lease(address user, uint256 amount);

    event RemoveLease(address user, uint256 amount);

    event Claim(address user, uint256 amount);

    event ClaimLeaseProfit(address user, uint256 amount);

    function router() external view returns(address);

    function payment() external view returns(address);

    function interestRateModel() external view returns(address);

    function getLeasePrice(uint256 _supplyAmount, uint256 _leaseAmount) external view returns(uint256);

    function nftShares(address _nft, uint256 _tokenId) external view returns(uint256);

    function totalLeaseAmount() external view returns(uint256);

    function supply(address[] calldata _nfts, uint256[] calldata _tokenIds) external;

    function redeem(address[] calldata _nfts,
        uint256[] calldata _tokenIds) external;

    function lease(uint256 _amount, uint256 _period) external;

    function userLeaseInfo(address _user) external view 
      returns(
        uint256, 
        uint256, 
        uint256
        );

    function pendingProfit(address _owner) external view returns(uint256);

    function cancelLease(address[] calldata) external;

    function claimSupplyProfit() external;
}