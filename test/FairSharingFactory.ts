import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('FairSharingFactory', function () {
  async function deployFairSharingFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, ...otherAccounts] = await ethers.getSigners();
    const FairSharingFactory = await ethers.getContractFactory(
      'FairSharingFactory'
    );
    const fairSharingFactory = await FairSharingFactory.deploy();

    return { fairSharingFactory, owner, otherAccounts };
  }

  describe('Crete more contracts', function () {
    it('Should be able to create contracts and set sender to owner', async function () {
      const { fairSharingFactory, owner, otherAccounts } = await loadFixture(
        deployFairSharingFixture
      );

      const tx = await fairSharingFactory.createFairSharing(
        'TokenName',
        'TokenSymbol',
        [owner.address, otherAccounts[0].address, otherAccounts[1].address],
        owner.address
      );
      const receipt = await tx.wait();
      let fairSharingAddress;
      if (receipt?.events) {
        fairSharingAddress = receipt?.events[0].address;
        const FairSharing = await ethers.getContractFactory('FairSharing');
        const fairSharing = FairSharing.attach(fairSharingAddress);

        expect(await fairSharing.owner()).to.equal(owner.address);
      }
    });
  });
});
