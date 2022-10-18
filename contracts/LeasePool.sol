// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./IPool.sol";
import "./IVault.sol";
import "./IUsageRateOracle.sol";
import "./ILeaseModel.sol";
import "./IERC4907.sol";

contract LeasePool is ERC20, Ownable, IPool {
    using SafeERC20 for IERC20;

    address public override immutable router;

    address public override immutable payment;

    address public override interestRateModel;

    address public nftVault;

    mapping(address => mapping(uint256 => uint256)) public override nftShares;

    mapping(address => mapping(uint256 => address)) public nftOwners;

    mapping(address => UserLeaseInfo) public userLeaseInfos;

    mapping(address => uint256) public userProfitPerShare;

    uint256 public accProfitPerShare;

    uint256 public costPerLeaseShare;

    uint256 public override totalLeaseAmount;

    uint256 public accrualBlockNumber;

    uint256 public constant DURATION = 300;

    event AccrueInterest(uint256 interestAccumulated, uint256 _accProfitPerShare, uint256 _costPerLeaseShare);

    constructor(address _router, address _payment,
          address _interestRateModel, address _nftVault) ERC20("LeasePool", "LP") {
        router = _router;
        payment = _payment;
        interestRateModel = _interestRateModel;
        nftVault = _nftVault;
    }

    /**
      @inheritdoc IPool
     */
    function getLeasePrice(uint256 _supplyAmount, uint256 _leaseAmount) public override view returns(uint256) {
      uint256 totalSupplyPrior = totalSupply();
      totalSupplyPrior += _supplyAmount;
      if (totalSupplyPrior == 0) {
        return 0;
      }

      uint256 leasePrior = totalLeaseAmount;
      leasePrior += _leaseAmount;
      uint256 rentCost = ILeaseModel(interestRateModel).calcLeaseCost(leasePrior, totalSupplyPrior-leasePrior);
      return rentCost;
    }

    /**
      @inheritdoc IPool
     */
    function userLeaseInfo(address _user) external view override 
        returns(uint256 _share, uint256 _margin, uint256 _paid) {
        UserLeaseInfo memory uli = userLeaseInfos[_user];
        _share = uli.share;
        _margin = uli.margin;
        _paid = uli.paid;
    }

    function accrueInterest() public returns (uint256 _blockDelta, uint256 _rentCost) {
      uint256 currentBlockNumber = block.number;
      uint256 accrualBlockNumberPrior = accrualBlockNumber;
      if (accrualBlockNumberPrior == currentBlockNumber) {
          return (0, 0);
      }

      uint256 totalSupplyPrior = totalSupply();
      if (totalSupplyPrior == 0) {
        return (0, 0);
      }

      uint256 leasePrior = totalLeaseAmount;
      uint256 blockDelta = currentBlockNumber - accrualBlockNumberPrior;
      uint256 rentCost = ILeaseModel(interestRateModel).calcLeaseCost(leasePrior, totalSupplyPrior-leasePrior);
      uint256 interestAccumulated = blockDelta * rentCost * leasePrior / 1e18;
      uint256 accProfitPerShareNew = accProfitPerShare + interestAccumulated * 1e18 / totalSupplyPrior;
      accProfitPerShare = accProfitPerShareNew;
      accrualBlockNumber = block.number;

      updateUserLeaseInternal(blockDelta, rentCost, msg.sender);
      
      emit AccrueInterest(interestAccumulated, accProfitPerShare, costPerLeaseShare);
    }

    function updateUserLeaseInternal(uint256 _blockDelta, uint256 _rentCost, address _user) public {
      uint256 costPerLeaseShareNew = costPerLeaseShare;
      costPerLeaseShareNew += _blockDelta * _rentCost;
      costPerLeaseShare = costPerLeaseShareNew;

      UserLeaseInfo memory uli = userLeaseInfos[_user];
      if (uli.share == 0) {
        return;
      }

      uint256 _cost = (costPerLeaseShareNew - uli.costPerLeaseShare) * uli.share / 1e18;
      if (_cost > 0) { 
        require(uli.margin >= (_cost+uli.paid), "!margin");
        userLeaseInfos[_user].paid += _cost;
        userLeaseInfos[_user].costPerLeaseShare = costPerLeaseShareNew;
      }
    }

    function supplyInternal(address _nft, uint256 _tokenId) internal returns(uint256 _share) {
        // console.log("nft address", _nft);
        _share = IUsageRateOracle(router).usageRateOf(_tokenId);
        require(_share > 0, "!share");
        nftOwners[_nft][_tokenId] = msg.sender;
        nftShares[_nft][_tokenId] += _share;
        // IERC4907(_nft).setUser(_tokenId, address(this), block.timestamp + 1 days);
        IERC721(_nft).safeTransferFrom(msg.sender, nftVault, _tokenId);
        emit Supply(msg.sender, _nft, _tokenId, _share);
    }

    /**
      @inheritdoc IPool
     */
    function supply(
        address[] calldata _nfts, 
        uint256[] calldata _tokenIds
    ) external override {
        require(_nfts.length == _tokenIds.length, "!length");
        accrueInterest();
        claimSupplyProfitInternal(msg.sender);

        uint256 _share = 0;
        for (uint256 i=0;i<_nfts.length;++i) {
              address _nft = _nfts[i];
            uint256 _tokenId = _tokenIds[i];
            _share += supplyInternal(_nft, _tokenId);
        }
        _mint(msg.sender, _share);
    }

    /**
      @inheritdoc IPool
     */
    function redeem(address[] calldata _nfts, 
        uint256[] calldata _tokenIds) external override {
      accrueInterest();
      claimSupplyProfitInternal(msg.sender);
      uint256 _totalShare = 0;
      for (uint256 i=0;i<_nfts.length;++i) {
        address _nft = _nfts[i];
        uint256 _tokenId = _tokenIds[i];
        require(nftOwners[_nft][_tokenId] == msg.sender, "!owner");
        // IERC4907(_nft).setUser(_tokenId, address(this), 0);
        // IERC721(_nft).safeTransferFrom(address(this), msg.sender, _tokenId);
        _totalShare += nftShares[_nft][_tokenId];
        nftShares[_nft][_tokenId] = 0;
        nftOwners[_nft][_tokenId] = address(0);
        IVault(nftVault).withdraw(_nft, _tokenId, msg.sender);
      }
      require(_totalShare <= (totalSupply()-totalLeaseAmount), "!supply");
      _burn(msg.sender, _totalShare);
    }

    /**
      @inheritdoc IPool
     */
    function lease(uint256 _amount, uint256 _period) external override {
      // require(_amount > 0, "!amount");
      require(_amount+totalLeaseAmount <= totalSupply(), "exceed supply");
      accrueInterest();

      uint256 _leasePrice = getLeasePrice(0, _amount);
      uint256 _margin = _leasePrice * _amount * DURATION / 1e18;
      (uint256 _marginLeft, ) = cancelLeaseInternal(msg.sender);
      if (_margin > _marginLeft) {
        IERC20(payment).safeTransferFrom(msg.sender, address(this), _margin-_marginLeft);
      }

      if (_amount > 0) {
        leaseInternal(_amount, _margin, _period);
      } else {
        IERC20(payment).safeTransfer(msg.sender, _marginLeft); 
      }
    }

    function cancelLeaseInternal(address _user) internal returns(uint256 _margin, uint256 _height) {
      {
        UserLeaseInfo memory uli = userLeaseInfos[_user];
        _margin = uli.margin - uli.paid;
        _height = uli.height;
        totalLeaseAmount -= uli.share;
      }

      UserLeaseInfo storage uli = userLeaseInfos[_user];
      uli.share = 0;
      uli.margin = 0;
      uli.paid = 0;
      uli.height = 0;
    }

    function leaseInternal(uint256 _amount, uint256 _margin, uint256 _period) internal {
      totalLeaseAmount += _amount;
      UserLeaseInfo storage uli = userLeaseInfos[msg.sender];
      uli.share = _amount;
      uli.margin = _margin;
      uli.height = block.number + _period;
      uli.paid = 0;
    }

    /**
      @inheritdoc IPool
     */
    function pendingProfit(address owner) public override view returns(uint256 profit) {
      uint256 leasePrior = totalLeaseAmount;
      uint256 totalSupplyPrior = totalSupply();
      if (totalSupplyPrior == 0) {
        return balanceOf(owner) * (accProfitPerShare - userProfitPerShare[owner]) / 1e18;
      }

      uint256 rentCost = ILeaseModel(interestRateModel).calcLeaseCost(leasePrior, totalSupply() - leasePrior);
      uint256 a = (block.number - accrualBlockNumber) * rentCost * 1e18 / totalSupplyPrior;
      uint256 accProfitPerShareNew = a + accProfitPerShare;
      profit = balanceOf(owner) * (accProfitPerShareNew-userProfitPerShare[owner]) / 1e18;
    }

    /**
      @inheritdoc IPool
     */
    function cancelLease(address[] calldata _users) external override {
      (uint256 _blockDelta, uint256 _rentCost) = accrueInterest();
      for (uint256 i=0;i<_users.length;++i) {
        address _user = _users[i];
        updateUserLeaseInternal(_blockDelta, _rentCost, _user);
        (uint256 _margin, uint256 _height) = cancelLeaseInternal(_user);
        // require(_height <= block.number, "!period");
        if (_margin > 0) {
          IERC20(payment).safeTransfer(_user, _margin);
        }
      }
    }

    /**
      @dev
     */
    function marginLeft(address _user) external view returns(uint256 _margin) {
      uint256 blockDelta = block.number - accrualBlockNumber;
      uint256 rentCost = getLeasePrice(0, 0);
      uint256 costPerLeaseShareNew = costPerLeaseShare;
      costPerLeaseShareNew += blockDelta * rentCost;

      UserLeaseInfo memory uli = userLeaseInfos[_user];
      uint256 _cost = (costPerLeaseShareNew - uli.costPerLeaseShare) * uli.share / 1e18;
      _margin = uli.margin - uli.paid - _cost;
    }

    /**
      @inheritdoc IPool
     */
    function claimSupplyProfit() external override {
      accrueInterest();
      uint256 profit = claimSupplyProfitInternal(msg.sender);
      emit ClaimLeaseProfit(msg.sender, profit);
    }

    function claimSupplyProfitInternal(address _user) internal returns(uint256 profit) {
        profit = pendingProfit(_user);
        if (profit > 0) {
          IERC20(payment).safeTransfer(_user, profit);
        }
        userProfitPerShare[_user] = accProfitPerShare;
    }

    // /**
    //   @inheritdoc ISubscriber
    //  */
    // function onNFTChange(address[] calldata _nfts, uint256[] calldata _shares, uint256 _version) external override {
    //     require(msg.sender == router, "not from router");
    //     require(_nfts.length == _shares.length, "!length");

    // }
}
