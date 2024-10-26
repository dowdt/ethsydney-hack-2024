import { ethers } from "ethers";
import GovernorABI from "@/utils/contractABI.json";

export class ContractService {
  private governorContract: ethers.Contract;

  constructor(signer: ethers.JsonRpcSigner) {
    let governorContractAddress = process.env.GOVERNANCE_CONTRACT;
    if (!governorContractAddress) {
      governorContractAddress = "0xEa6A26A95618062c36F824F1Cc48fCB94e1Adb1a" // Default to hardcoded value
    }

    this.governorContract = new ethers.Contract(governorContractAddress, GovernorABI, signer);
  }

  // Get all created proposals
  async getCreatedProposals(): Promise<any[]> {
    try {
      const filter = this.governorContract.filters.ProposalCreated();
      const events = await this.governorContract.queryFilter(filter);
      
      // Map each event to a readable proposal object
      const proposals = events.map(event => ({
        proposalId: event.args?.proposalId,
        proposer: event.args?.proposer,
        targets: event.args?.targets,
        values: event.args?.values,
        calldatas: event.args?.calldatas,
        startBlock: event.args?.startBlock,
        endBlock: event.args?.endBlock,
        description: event.args?.description,
      }));
      
      console.log("Created Proposals: ", proposals);
      return proposals;
    } catch (error) {
      console.error("Failed to retrieve created proposals", error);
      throw new Error("Failed to retrieve created proposals");
    }
  }

  // Check if a proposal is eligible for execution
  async isProposalExecutable(proposalId: string): Promise<boolean> {
    try {
      const state = await this.governorContract.state(proposalId);
      console.log("Proposal state: ", state);
      return state === 4 || state === 5;
    } catch (error) {
      console.error("Failed to check proposal state:", error);
      throw new Error("Failed to check if proposal is executable");
    }
  }
  

  // Create a new proposal
  async propose(targets: string[], values: number[], calldatas: string[], description: string): Promise<string> {
    try {
      const tx = await this.governorContract.propose(targets, values, calldatas, description);
      await tx.wait();
      console.log("Proposal transaction submitted: ", tx.hash);
      return tx.hash;
    } catch (error) {
      console.error("Failed to create proposal", error);
      throw new Error("Failed to create proposal");
    }
  }

  // Cast a vote on an existing proposal
  async castVote(proposalId: number, support: number): Promise<string> {
    try {
      const tx = await this.governorContract.castVote(proposalId, support);
      await tx.wait();
      console.log("Vote cast transaction submitted: ", tx.hash);
      return tx.hash;
    } catch (error) {
      console.error("Failed to cast vote", error);
      throw new Error("Failed to cast vote");
    }
  }

  // View votes on a proposal
  async getProposalVotes(proposalId: string): Promise<{ forVotes: number; againstVotes: number; abstainVotes: number }> {
    try {
      // Initialize interface for decoding
      const governorInterface = new ethers.Interface(GovernorABI);
      
      // Fetch all VoteCast events for the specified proposalId
      const filter = this.governorContract.filters.VoteCast(null, proposalId);
      const events = await this.governorContract.queryFilter(filter);
  
      // Initialize vote counters
      let forVotes = 0;
      let againstVotes = 0;
      let abstainVotes = 0;
  
      // Tally votes by decoding each event's data
      events.forEach(event => {
        const decodedData = governorInterface.decodeEventLog("VoteCast", event.data, event.topics);
        
        // Extract support and weight from decoded data
        const support = decodedData.support;
        const weight = parseInt(decodedData.weight.toString(), 10); // Convert weight to integer
  
        // Count votes based on the support value
        switch (support) {
          case 0: // Against
            againstVotes += weight;
            break;
          case 1: // For
            forVotes += weight;
            break;
          case 2: // Abstain
            abstainVotes += weight;
            break;
          default:
            console.warn("Unknown support value:", support);
        }
      });
  
      return { forVotes, againstVotes, abstainVotes };
    } catch (error) {
      console.error("Failed to get proposal votes", error);
      throw new Error("Failed to get proposal votes");
    }
  }

  // Execute a proposal with the same parameters used to create it
  async executeProposal(
    targets: string[],
    calldatas: string[],
    descriptionHash: string
  ): Promise<string> {
    try {
      // Compute the description hash
      const values = [0]

      // Execute the proposal
      const tx = await this.governorContract.execute(targets, values, calldatas, descriptionHash);
      await tx.wait();
      console.log("Proposal execution transaction submitted: ", tx.hash);
      return tx.hash;
    } catch (error) {
      console.error("Failed to execute proposal", error);
      throw new Error("Failed to execute proposal");
    }
  }
  
}
