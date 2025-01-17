// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

contract ComputeDAO is Governor, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction {
    constructor(IVotes _token)
        Governor("ComputeDAO")
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(5)
    {}

    function votingDelay() public pure override returns (uint256) {
        return 0 seconds;
    }

    function votingPeriod() public pure override returns (uint256) {
        return 3 minutes;
    }

    event VotedProgramData(bytes[] data);

    function _executeOperations(
        uint256 /* proposalId */,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 /*descriptionHash*/
    ) internal override  {
        emit VotedProgramData(calldatas);
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }
}
