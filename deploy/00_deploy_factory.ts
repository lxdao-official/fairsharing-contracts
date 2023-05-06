import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

module.exports = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  await deploy("FairSharingFactory", {
    from: deployer,
    log: true,
  });
};

module.exports.tags = ["all", "factory"];
