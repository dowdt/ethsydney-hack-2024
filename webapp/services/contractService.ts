import { ethers } from "ethers";
import GovernorABI from "@/utils/contractABI.json";

const GOVERNOR_CONTRACT_ADDRESS = process.env.GOVERNANCE_CONTRACT
if (!GOVERNOR_CONTRACT_ADDRESS) {
    throw new Error("Missing GOVERNANCE_CONTRACT environment variable");
}
const provider = ethers.AnkrProvider.caller("sepolia");
const signer = provider.getSigner();

// Initialize contract
const governorContract = new ethers.Contract(GOVERNOR_CONTRACT_ADDRESS, GovernorABI, signer);

// Create a new proposal
export const propose = async (targets: string[], values: number[], calldatas: string[], description: string): Promise<string> => {
  try {
    const tx = await governorContract.propose(targets, values, calldatas, description);
    await tx.wait();
    console.log("Proposal transaction submitted: ", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("Failed to create proposal", error);
    throw new Error("Failed to create proposal");
  }
};

// Cast a vote on an existing proposal
export const castVote = async (proposalId: number, support: number): Promise<string> => {
  try {
    const tx = await governorContract.castVote(proposalId, support);
    await tx.wait();
    console.log("Vote cast transaction submitted: ", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("Failed to cast vote", error);
    throw new Error("Failed to cast vote");
  }
};

// Get the state of a proposal
export const getProposalState = async (proposalId: number): Promise<number> => {
  try {
    const state = await governorContract.state(proposalId);
    console.log("Proposal state: ", state);
    return state;
  } catch (error) {
    console.error("Failed to get proposal state", error);
    throw new Error("Failed to get proposal state");
  }
};

// Check if an address has voted on a proposal
export const hasVoted = async (proposalId: number, address: string): Promise<boolean> => {
  try {
    const voted = await governorContract.hasVoted(proposalId, address);
    console.log("Has voted: ", voted);
    return voted;
  } catch (error) {
    console.error("Failed to check voting status", error);
    throw new Error("Failed to check voting status");
  }
};

// Get proposal details
export const getProposalVotes = async (proposalId: number): Promise<Response> => {
  try {
    const proposal = await governorContract.proposalVotes(proposalId);
    console.log("Proposal details: ", proposal);
    return proposal;
  } catch (error) {
    console.error("Failed to get proposal details", error);
    throw new Error("Failed to get proposal details");
  }
};
