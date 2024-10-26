const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Import the fixture from the previously created file
const { deployComputeDAOFixture } = require("../fixtures/compute_dao_fixture");

describe("ComputeDAO", function () {
  it("Should deploy the contracts and set the right roles", async function () {
    const { computeDAO, timelock, deployer, proposer, executor } = await loadFixture(deployComputeDAOFixture);
    console.log("The proposer is:", proposer.address);

    // Check the PROPOSER_ROLE has been granted to the ComputeDAO
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    expect(await timelock.hasRole(PROPOSER_ROLE, computeDAO.address)).to.equal(true);

    // Check the EXECUTOR_ROLE has been granted to the executor
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    expect(await timelock.hasRole(EXECUTOR_ROLE, executor.address)).to.equal(true);

    // Check the CANCELLER_ROLE has been granted to the deployer
    const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();
    expect(await timelock.hasRole(CANCELLER_ROLE, deployer.address)).to.equal(true);
  });
});
