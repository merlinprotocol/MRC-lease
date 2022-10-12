require("@nomicfoundation/hardhat-toolbox")
require("hardhat-deploy")
require('@nomiclabs/hardhat-ethers')

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.4",
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
};
