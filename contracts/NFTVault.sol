// SPDX-License-Identifier: MIT
// contracts/NFTVault.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./IVault.sol";

contract NFTVault is Ownable, IVault, IERC721Receiver {
    /**
      @inheritdoc IERC721Receiver
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function withdraw(
        address _nft,
        uint256 _tokenId,
        address _to
    ) external override onlyOwner {
        IERC721(_nft).safeTransferFrom(address(this), _to, _tokenId);
    }
}
