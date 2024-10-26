// app/proposals/page.tsx
"use client";

//@ts-nocheck

//@ts-expect-error

import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, Clock, CheckCircle2 } from "lucide-react";
import { ContractService } from "@/services/contractService";

type Proposal = {
  proposalId: string;
  proposer: string;
  targets: string[];
  values: bigint[];
  calldatas: string[];
  descriptionHash: string;
  dateSubmitted: string;
  votes: { forVotes: string; againstVotes: string; abstainVotes: string };
  isExecutable: boolean;
};

const VotingInterface = ({ contractService }: { contractService: ContractService }) => {
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [proposals, setProposals] = useState<Proposal[]>([]);


  // Timer effect
  useEffect(() => {
    const roundEndTime = new Date();
    roundEndTime.setHours(roundEndTime.getHours() + 24);
    const timerInterval = setInterval(() => {
      const now = new Date();
      const diff = roundEndTime.getTime() - now.getTime();
      if (diff <= 0) clearInterval(timerInterval);
      setTimeRemaining({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  const loadProposals = async (service: ContractService) => {
    try {
      const allProposals = await service.getCreatedProposals();
  
      const enrichedProposals = await Promise.all(
        allProposals.map(async (proposal) => {
          try {
            const isExecutable = await service.isProposalExecutable(proposal.proposalId);
            const votes = await service.getProposalVotes(proposal.proposalId);
  
            return {
              ...proposal,
              descriptionHash: proposal.descriptionHash || "",
              isExecutable,
              votes,
              //dateSubmitted: proposal.dateSubmitted || new Date().toISOString(), // Use actual date if available
            };
          } catch (proposalError) {
            console.error(`Error enriching proposal ${proposal.proposalId}:`, proposalError);
            return { ...proposal, isExecutable: false, votes: { forVotes: 0, againstVotes: 0, abstainVotes: 0 } }; // Default values on error
          }
        })
      );
  
      setProposals(enrichedProposals.sort((a, b) => Date.parse(b.dateSubmitted) - Date.parse(a.dateSubmitted)));
    } catch (error) {
      console.error("Failed to load proposals:", error);
    }
  };
  

useEffect(() => {
  const fetchProposals = async () => {
    if (contractService) {
      try {
        await loadProposals(contractService);
      } catch (error) {
        console.error("Error loading proposals:", error);
      }
    }
  };
  fetchProposals();
}, [contractService]);

  const handleVote = async (proposalId: string) => {
    if (!contractService) return;
    try {
      await contractService.castVote(proposalId, 1); // '1' represents voting "for" the proposal
      setProposals((prevProposals) =>
        prevProposals.map((proposal) =>
          proposal.proposalId === proposalId
            ? { ...proposal, votes: { ...proposal.votes, forVotes: proposal.votes.forVotes + 1 } }
            : proposal
        )
      );
    } catch (error) {
      console.error("Voting failed:", error);
    }
  };

  const executeProposal = async (proposal: Proposal) => {
    if (!contractService || proposal.isExecutable) return;
    try {
      await contractService.executeProposal(
        proposal.targets,
        proposal.values,
        proposal.calldatas,
        proposal.descriptionHash // Convert descriptionHash to hash
      );
      console.log(`Executed proposal ${proposal.proposalId}`);
    } catch (error) {
      console.error("Proposal execution failed:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
  };

  return (
    <div className="space-y-8">
      {/* Round Timer */}
      <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">
            <div className="flex items-center gap-2">
              <Timer className="w-6 h-6" />
              Current Voting Round
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-center py-4">
            {`${timeRemaining.hours.toString().padStart(2, '0')}:${timeRemaining.minutes.toString().padStart(2, '0')}:${timeRemaining.seconds.toString().padStart(2, '0')}`}
          </div>
        </CardContent>
      </Card>

      {/* Proposals */}
      <Card className="border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" />
            Proposals
          </CardTitle>
          <CardDescription>Vote on or execute proposals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div key={proposal.proposalId} className="glass p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-blue-400">Proposal ID: {proposal.proposalId}</p>
                    <p className="text-sm text-gray-400">Proposer: {proposal.proposer}</p>
                    <p className="text-sm text-gray-400">Targets: {proposal.targets.join(", ")}</p>
                    <p className="text-sm text-gray-400">{proposal.descriptionHash}</p>
                    <p className="text-sm text-gray-400">For Votes: {proposal.votes.forVotes} | Against Votes: {proposal.votes.againstVotes} | Abstain Votes: {proposal.votes.abstainVotes}</p>
                  </div>
                  <div className="text-sm text-gray-400">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {formatDate(proposal.dateSubmitted)}
                    {proposal.isExecutable && (
                      <p className="text-sm text-green-500">Executable</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <AlertDialog>
                    <AlertDialogTrigger className="cyberpunk-button-sm">
                      Vote
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Vote</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to vote for this proposal? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleVote(proposal.proposalId)}>
                          Confirm Vote
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                    <button
                        onClick={() => executeProposal(proposal)}
                        className="cyberpunk-button-sm"
                    >
                        Execute
                    </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VotingInterface;
