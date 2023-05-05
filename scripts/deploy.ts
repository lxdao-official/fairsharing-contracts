import { ethers } from 'hardhat';

async function main() {
  const signers = await ethers.getSigners();
  const members = [
    await signers[0].getAddress(),
    await signers[1].getAddress(),
    await signers[2].getAddress(),
  ];
  const FairSharing = await ethers.getContractFactory('FairSharing');
  const fairSharing = await FairSharing.deploy(
    'TokenName',
    'TokenSymbol',
    members,
    signers[0].address
  );

  await fairSharing.deployed();

  console.log(`Deployed to ${fairSharing.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
