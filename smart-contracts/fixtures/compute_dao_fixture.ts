const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

// Fixture for deploying ComputeDAO contract
async function deployComputeDAOFixture() {
  const [deployer, proposer, executor, otherAccount] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy ERC721 Token for Voting (ComputeToken)
  const Token = await ethers.getContractFactory("ComputeToken");
  const token = await Token.deploy(deployer.address);
  
  // Mint some tokens to proposer and executor
  await token.safeMint(proposer.address);
  await token.safeMint(executor.address);

  // Deploy ComputeDAO Governance Contract
  const ComputeDAO = await ethers.getContractFactory("ComputeDAO");
  const computeDAO = await ComputeDAO.deploy(token.address);
  // No need to call deployed() for the new instance; it's already deployed by deploy()

  // Transfer ownership of ComputeToken to ComputeDAO
  await token.transferOwnership(computeDAO.address);


  // Return all deployed contracts and signers
  return {
    computeDAO,
    token,
    deployer,
    proposer,
    executor,
    otherAccount
  };
}

module.exports = {
  deployComputeDAOFixture,
};
