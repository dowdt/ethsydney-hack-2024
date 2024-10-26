import { ethers } from "ethers";
import GovernorABI from "@/utils/contractABI.json";

interface CreatedProposal {
  proposalId: string;
  proposer: string;
  targets: string[];
  values: bigint[];
  calldatas: string[];
  descriptionHash: string;
  startBlock: number;
  endBlock: number;
}

export class ContractService {
  private governorContract: ethers.Contract;

  constructor(signer: ethers.JsonRpcSigner) {
    const governorContractAddress = process.env.GOVERNANCE_CONTRACT || "0x521BC5Ac79AE22C081d9C615504e4F642C672BE2";
    this.governorContract = new ethers.Contract(governorContractAddress, GovernorABI, signer);
  }

  // Fetch all created proposals without filtering by proposalId
  // Define the Proposal interface
  async getCreatedProposals(): Promise<Proposal[]> {
    try {
        const filter = this.governorContract.filters.ProposalCreated();
        const events = await this.governorContract.queryFilter(filter);

        console.log("Raw Event Data: ", JSON.stringify(events));

        // Map each event to a structured proposal object
        const proposals = events.map((event): Proposal => {
            const proposalId = event.args?.proposalId?.toString() ?? "";
            const proposer = event.args?.proposer ?? "";
            
            // Ensure that targets, values, and calldatas are arrays
            const targets = Array.isArray(event.args?.targets) 
                ? event.args.targets.map(target => target.toString())
                : [];
            
            const values = Array.isArray(event.args?.values) 
                ? event.args.values.map(v => BigInt(v.toString())) 
                : [BigInt(0)];  // Defaults to [BigInt(0)] if undefined

            const calldatas = Array.isArray(event.args?.calldatas)
                ? event.args.calldatas.map(cd => cd.toString())
                : [];

            const descriptionHash = event.args?.description ?? "";
            const startBlock = Number(event.args?.startBlock ?? 0);
            const endBlock = Number(event.args?.endBlock ?? 0);

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
      // Check the proposal's current state
      const state = await this.governorContract.state(proposalId);
      console.log("Proposal state: ", state);
  
      // If the proposal is already in "Succeeded" or "Queued" state (typically 4 or 5), it can be executed
      if (state === 4 || state === 5) {
        return true;
      }
  
      // If the proposal is still "Active," check if it has the majority of votes and meets the quorum
      if (state === 1) {
        // Retrieve the votes
        const { forVotes, againstVotes, abstainVotes } = await this.governorContract.proposalVotes(proposalId);
  
        // Define quorum requirements (this will depend on your contract's quorum calculation)
        const quorum = await this.governorContract.quorum(await this.governorContract.proposalSnapshot(proposalId));
  
        // Check if the proposal meets the quorum and majority
        const hasMajority = forVotes > againstVotes && forVotes >= quorum;
  
        if (hasMajority) {
          return true;
        }
      }
  
      return false; // Default to non-executable if none of the conditions above are met
    } catch (error) {
      console.error("Failed to check proposal executable status:", error);
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
        forVotes: forVotes.toString(),
        againstVotes: againstVotes.toString(),
        abstainVotes: abstainVotes.toString(),

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
          //console.error("Failed to execute proposal:", error);
          throw new Error("Failed to execute proposal");
      }
  }

  async getProposalState(proposalId: string): Promise<string> {
    try {
      const state = await this.governorContract.state(proposalId);
  
      // Mapping state integers to human-readable status strings
      const stateMapping: { [key: number]: string } = {
        0: "Pending",
        1: "Active",
        2: "Canceled",
        3: "Defeated",
        4: "Succeeded",
        5: "Queued",
        6: "Expired",
        7: "Executed",
      };
  
      const stateString = stateMapping[state] || "Unknown";
      console.log(`Proposal ${proposalId} is in state: ${stateString}`);
      
      return stateString;
    } catch (error) {
      console.error("Failed to retrieve proposal state:", error);
      throw new Error("Failed to retrieve proposal state");
    }
  }
  

  
}
