const { ethers } = require('hardhat')
const { expect } = require('chai')
const fs = require("fs");

async function func() {
  const { getNamedAccounts } = hre
  const { deployer } = await getNamedAccounts()
  const [_, leaser] = await ethers.getSigners()

  const usdtTotalSupply = ethers.utils.parseEther('10000000')
  const usdtDecimals = 18
  await deployments.deploy('USDT', {
    from: deployer,
    contract: 'MockERC20',
    log: true,
    args: ['usdt', 'usdt', usdtTotalSupply, usdtDecimals],
  });
  const usdt = await ethers.getContract('USDT')

  await deployments.deploy('MockERC4907', {
    from: deployer,
    contract: 'MockERC4907',
    log: true,
    args: ["ERC4907", "NFT"],
  });
  const nft = await ethers.getContract('MockERC4907')

  await deployments.deploy('MockOracle', {
    from: deployer,
    contract: 'MockUsageRateOracle',
    log: true,
    args: [nft.address],
  });
  const oracle = await ethers.getContract('MockOracle')

  const baseRate = ethers.utils.parseEther('0.00001')
  const multplier = ethers.utils.parseEther('0.0001')
  await deployments.deploy('LeaseModel', {
    from: deployer,
    contract: 'LeaseModelTwo',
    log: true,
    args: [baseRate, multplier],
  });
  const model = await ethers.getContract('LeaseModel')

  await deployments.deploy('NFTVault', {
    from: deployer,
    contract: 'NFTVault',
    log: true,
    args: [],
  });
  const nftVault = await ethers.getContract('NFTVault')

  await deployments.deploy('MockPool', {
    from: deployer,
    contract: 'LeasePool',
    log: true,
    args: [oracle.address, usdt.address, model.address, nftVault.address],
  });
  const pool = await ethers.getContract('MockPool')
  let tx
  if (pool.address != await nftVault.owner()) {
    tx = await nftVault.transferOwnership(pool.address)
    await tx.wait()
  }

  if (!await nft.isApprovedForAll(deployer, pool.address)) {
    tx = await nft.setApprovalForAll(pool.address, true)
    await tx.wait()
  }

  const tokenId = await nft.nextId()
  tx = await nft.mint(deployer)
  await tx.wait()

  tx = await pool.supply([nft.address], [tokenId])
  await tx.wait()

  const totalSupply = await pool.totalSupply()
  const leaseAmount = totalSupply.div(10)

  if ((await usdt.allowance(deployer, leaser.address)).lt(leaseAmount)) {
    tx = await usdt.connect(leaser).approve(pool.address, ethers.constants.MaxUint256)
    await tx.wait()
  }

  let balance = await usdt.balanceOf(deployer)
  if (balance.gt(0)) {
    tx = await usdt.transfer(leaser.address, balance)
    await tx.wait()
  }

  const totalLeaseAmountBefore = await pool.totalLeaseAmount()
  const period = 100
  tx = await pool.connect(leaser).lease(leaseAmount, period)
  await tx.wait()

  const totalLeaseAmountAfter = await pool.totalLeaseAmount()
  expect(totalLeaseAmountAfter).to.eq(totalLeaseAmountBefore.add(leaseAmount))

  const leasePrice = await pool.getLeasePrice(0, 0)
  console.log('leasePrice', ethers.utils.formatEther(leasePrice))

  for (let i = 0; i < 10; ++i) { // mining
    tx = await usdt.approve(usdt.address, 0)
    await tx.wait()
  }

  const user = deployer
  const pendingProfit = await pool.pendingProfit(user)
  console.log('pendingProfit', ethers.utils.formatEther(pendingProfit))

  const marginLeft = await pool.marginLeft(leaser.address)
  console.log('marginLeft', ethers.utils.formatEther(marginLeft))

  const userLeaseInfo = await pool.userLeaseInfo(leaser.address)
  console.log('userLeaseInfo', ethers.utils.formatEther(userLeaseInfo._share), ethers.utils.formatEther(userLeaseInfo._margin))
  expect(userLeaseInfo._share).to.eq(leaseAmount)

  // tx = await pool.connect(leaser).lease(0, 0)
  // await tx.wait()
  // console.log('abortLease')

  // tx = await pool.cancelLease([leaser.address])
  // await tx.wait()
  // console.log('cancelLease')
  // {
  //   const userLeaseInfo = await pool.userLeaseInfo(leaser.address)
  //   expect(userLeaseInfo._share).to.eq(0)
  // }

  // tx = await pool.redeem([nft.address], [tokenId])
  // await tx.wait()
  // console.log('redeem')
  // expect(await pool.totalSupply()).to.eq(0)

  tx = await pool.claimSupplyProfit()
  await tx.wait()

  fs.writeFileSync('./.env.local', `
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_NETWORK=http://localhost:8545
NEXT_PUBLIC_MULTICALL_ADDRESSES=
NEXT_PUBLIC_POOL_ADDRESS=${pool.address}
NEXT_PUBLIC_USDT_ADDRESS=${usdt.address}
NEXT_PUBLIC_NFT_ADDRESS=${nft.address}
  `, "utf-8");
}

module.exports = func

func.tags = ['lease']