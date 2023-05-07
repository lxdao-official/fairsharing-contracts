import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { utils, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { FairSharing } from "../typechain-types";

describe("FairSharing", function () {
  async function deployFairSharingFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, ...otherAccounts] = await ethers.getSigners();
    const members = [
      await otherAccounts[0].getAddress(),
      await otherAccounts[1].getAddress(),
      await otherAccounts[2].getAddress(),
    ];

    const FairSharing = await ethers.getContractFactory("FairSharing");
    const fairSharing = await FairSharing.deploy(
      "TokenName",
      "TokenSymbol",
      members,
      owner.address
    );

    return { fairSharing, owner, otherAccounts };
  }
  describe("Claim", function () {
    it("Caller should be a member", async function () {
      const { fairSharing, otherAccounts } = await loadFixture(
        deployFairSharingFixture
      );
      const contributor = otherAccounts[0];
      const db3Id = "AQAAAAAAJLn8AAEAAQAAAAAAJfcQAAEAAA==";
      const inputHexString = ethers.utils.hexlify(
        ethers.utils.toUtf8Bytes(db3Id)
      );
      const contributionId = ethers.utils.keccak256(inputHexString);

      const points = utils.parseEther("1");
      const votes = await Promise.all(
        otherAccounts.slice(0, 2).map(async (voterAccount) => {
          const voter = await voterAccount.getAddress();
          const approve = true;
          const msgHash = utils.solidityKeccak256(
            ["address", "bytes32", "address", "bool", "uint256"],
            [contributor.address, contributionId, voter, approve, points]
          );
          const signature = await voterAccount.signMessage(
            utils.arrayify(msgHash)
          );
          return {
            voter,
            approve,
            signature,
          };
        })
      );

      await expect(
        fairSharing.claim(contributionId, points, votes)
      ).to.be.revertedWith("Only member can claim");
    });

    it("Caller should be the contributor", async function () {
      const { fairSharing, owner, otherAccounts } = await loadFixture(
        deployFairSharingFixture
      );
      const contributionId = ethers.utils.keccak256(
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes("1"))
      );
      const contributor = otherAccounts[0];
      const points = utils.parseEther("1");
      const votes = await Promise.all(
        otherAccounts.slice(0, 2).map(async (voterAccount) => {
          const voter = await voterAccount.getAddress();
          const approve = true;
          const msgHash = utils.solidityKeccak256(
            ["address", "bytes32", "address", "bool", "uint256"],
            [contributor.address, contributionId, voter, approve, points]
          );
          const signature = await voterAccount.signMessage(
            utils.arrayify(msgHash)
          );
          return {
            voter,
            approve,
            signature,
          };
        })
      );
      const claimer = otherAccounts[1]; // difference from contributor

      await expect(
        fairSharing.connect(claimer).claim(contributionId, points, votes)
      ).to.be.revertedWith("Wrong signature");
    });

    it("Should claim right amount token", async function () {
      const { fairSharing, otherAccounts } = await loadFixture(
        deployFairSharingFixture
      );
      const db3Id = "AQAAAAAAJLn8AAEAAQAAAAAAJfcQAAEAAA==";
      const inputHexString = ethers.utils.hexlify(
        ethers.utils.toUtf8Bytes(db3Id)
      );
      const contributionId = ethers.utils.keccak256(inputHexString);
      const contributor = otherAccounts[0];
      const points = utils.parseEther("1");
      const votes = await Promise.all(
        otherAccounts.slice(0, 2).map(async (voterAccount) => {
          const voter = await voterAccount.getAddress();
          const approve = true;
          const msgHash = utils.solidityKeccak256(
            ["address", "bytes32", "address", "bool", "uint256"],
            [contributor.address, contributionId, voter, approve, points]
          );
          const signature = await voterAccount.signMessage(
            utils.arrayify(msgHash)
          );
          return {
            voter,
            approve,
            signature,
          };
        })
      );

      const claimer = contributor;

      const tx = await fairSharing
        .connect(claimer)
        .claim(contributionId, points, votes);
      await tx.wait();

      const claimedToken = await fairSharing.balanceOf(claimer.address);
      expect(claimedToken.eq(points)).to.be.true;
    });

    it("Should prevent double claim", async function () {
      const { fairSharing, otherAccounts } = await loadFixture(
        deployFairSharingFixture
      );
      const contributionId = ethers.utils.keccak256(
        ethers.utils.hexlify(ethers.utils.toUtf8Bytes("1"))
      );
      const contributor = otherAccounts[0];
      const points = utils.parseEther("1");
      const votes = await Promise.all(
        otherAccounts.slice(0, 2).map(async (voterAccount) => {
          const voter = await voterAccount.getAddress();
          const approve = true;
          const msgHash = utils.solidityKeccak256(
            ["address", "bytes32", "address", "bool", "uint256"],
            [contributor.address, contributionId, voter, approve, points]
          );
          const signature = await voterAccount.signMessage(
            utils.arrayify(msgHash)
          );
          return {
            voter,
            approve,
            signature,
          };
        })
      );

      const claimer = contributor;

      const tx = await fairSharing
        .connect(claimer)
        .claim(contributionId, points, votes);
      await tx.wait();

      await expect(
        fairSharing.claim(contributionId, points, votes)
      ).to.be.revertedWith("Already claimed");
    });
  });

  describe("Sharing", function () {
    const claim = async (
      fairSharing: FairSharing,
      contributionId: string,
      points: BigNumber,
      voters: SignerWithAddress[],
      contributor: SignerWithAddress
    ) => {
      const votes = await Promise.all(
        voters.map(async (voterAccount) => {
          const voter = await voterAccount.getAddress();
          const approve = true;
          const msgHash = utils.solidityKeccak256(
            ["address", "bytes32", "address", "bool", "uint256"],
            [contributor.address, contributionId, voter, approve, points]
          );
          const signature = await voterAccount.signMessage(
            utils.arrayify(msgHash)
          );
          return {
            voter,
            approve,
            signature,
          };
        })
      );

      const claimer = contributor;

      const tx = await fairSharing
        .connect(claimer)
        .claim(contributionId, points, votes);
      await tx.wait();

      const claimedToken = await fairSharing.balanceOf(claimer.address);

      expect(claimedToken.eq(points)).to.be.true;
    };

    it("Should evenly distribute payment", async function () {
      const { fairSharing, otherAccounts } = await loadFixture(
        deployFairSharingFixture
      );

      const points1 = utils.parseEther("1");
      const points2 = utils.parseEther("4");
      const member1 = otherAccounts[0];
      const member2 = otherAccounts[1];

      const balanceBefore1 = await member1.getBalance();
      const balanceBefore2 = await member2.getBalance();

      const db3Id1 = "AQAAAAAAJLn8AAEAAQAAAAAAJfcQAAEAAA==";
      const db3Id2 = "BQAAAAAAJLn8AAEAAQAAAAAAJfcQAAEAAA==";
      await claim(
        fairSharing,
        // ethers.utils.formatBytes32String("1"),
        ethers.utils.keccak256(
          ethers.utils.hexlify(ethers.utils.toUtf8Bytes(db3Id1))
        ),
        points1,
        otherAccounts.slice(0, 2),
        member1
      );
      await claim(
        fairSharing,
        ethers.utils.keccak256(
          ethers.utils.hexlify(ethers.utils.toUtf8Bytes(db3Id2))
        ),
        points2,
        otherAccounts.slice(0, 2),
        member2
      );

      const tx = await fairSharing.sharing({ value: utils.parseEther("9") });
      await tx.wait();
      const balanceAfter1 = await member1.getBalance();
      const balanceAfter2 = await member2.getBalance();

      expect(balanceAfter1.sub(balanceBefore1).eq(utils.parseEther("3")));
      expect(balanceAfter2.sub(balanceBefore2).eq(utils.parseEther("6")));
    });
  });
});
