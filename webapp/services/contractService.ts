import { ethers, BigNumberish } from "ethers";
import GovernorABI from "@/utils/contractABI.json";

export class ContractService {
  private governorContract: ethers.Contract;

  constructor(signer: ethers.JsonRpcSigner) {
    const governorContractAddress = process.env.GOVERNANCE_CONTRACT || "0xEa6A26A95618062c36F824F1Cc48fCB94e1Adb1a";
    this.governorContract = new ethers.Contract(governorContractAddress, GovernorABI, signer);
  }

  // Fetch all created proposals without filtering by proposalId
  // Fetch all created proposals without filtering by proposalId
  async getCreatedProposals(): Promise<any[]> {
    try {
        const filter = this.governorContract.filters.ProposalCreated();
        const events = await this.governorContract.queryFilter(filter);

        console.log("Raw Event Data: ", JSON.stringify(events));

        // Map each event to a structured proposal object
        const proposals = events.map(event => {
            const proposalId = event.args?.proposalId?.toString() ?? "";
            const proposer = event.args?.proposer ?? "";
            const targets = Array.isArray(event.args?.targets) 
                ? [...event.args.targets] 
                : []; // Force to array
            const values = Array.isArray(event.args?.values) 
                ? event.args.values.map(v => BigInt(v)) 
                : [BigInt(0)]; // Ensure values are BigInts
            const calldatas = Array.isArray(event.args?.calldatas)
                ? [...event.args.calldatas]
                : [];
            const descriptionHash = event.args?.description ?? "";
            const startBlock = event.args?.startBlock ?? 0;
            const endBlock = event.args?.endBlock ?? 0;

            // Log missing values for debugging
            if (!proposalId) console.warn("Missing proposalId in event data:", event);
            if (!proposer) console.warn("Missing proposer in event data:", event);

            return {
                proposalId,
                proposer,
                targets,
                values,
                calldatas,
                descriptionHash,
                startBlock,
                endBlock
            };
        });

        console.log("Fetched Proposals: ", proposals);
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
      if (state === 4 || state === 5) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Failed to check proposal state:", error);
      throw new Error("Failed to check if proposal is executable");
    }
  }

  // Create a new proposal
  async propose(targets: string[], values: number[], calldatas: string[], descriptionHash: string): Promise<string> {
    try {
      const tx = await this.governorContract.propose(targets, values, calldatas, descriptionHash);
      await tx.wait();
      console.log("Proposal transaction submitted: ", tx.hash);
      return tx.hash;
    } catch (error) {
      console.error("Failed to create proposal", error);
      throw new Error("Failed to create proposal");
    }
  }

  // Cast a vote on an existing proposal
  async castVote(proposalId: string, support: number): Promise<string> {
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

  // Fetch all votes for a proposal by querying all VoteCast events and tallying up the votes
  async getProposalVotes(proposalId: string): Promise<{ forVotes: number; againstVotes: number; abstainVotes: number }> {
    try {
      // Call the proposalVotes function directly from the contract to get vote counts
      const [againstVotes, forVotes, abstainVotes] = await this.governorContract.proposalVotes(proposalId);
  
      // Return the parsed votes as numbers
      return {
        forVotes: forVotes,
        againstVotes: againstVotes,
        abstainVotes: abstainVotes,
      };
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
        // Since values are always zero and unused, we can default to a single-element array
        const values = [BigInt(0)];

        // Log inputs for debugging
        console.log("Executing proposal with parameters:", { 
            targets, 
            calldatas, 
            descriptionHash 
        });

        // Execute the proposal
        const tx = await this.governorContract.execute(targets, values, calldatas, descriptionHash);
        await tx.wait();
        console.log("Proposal execution transaction submitted:", tx.hash);
        return tx.hash;
    } catch (error) {
        console.error("Failed to execute proposal:", error.message);
        console.error(error.stack);
        throw new Error("Failed to execute proposal");
    }
}


  
}
