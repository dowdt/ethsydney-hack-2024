"use client"

import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer, Clock, CheckCircle2, History } from "lucide-react";

// Different data structures for UI
type Proposal = {
    id: string;
    name: string;
    url: string;
    dateSubmitted: string;
    votes?: number;
};

type HistoricalProposal = Proposal & {
    winningRound: number;
    dateImplemented: string;
};

const VotingInterface = () => {
    // State for current round timer
    const [timeRemaining, setTimeRemaining] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    // State for current proposals TODO: connect to backend
    const [currentProposals, setCurrentProposals] = useState<Proposal[]>([
        {
            id: '1',
            name: 'Optimistic Rollup Implementation',
            url: 'https://github.com/example/rollup-proposal',
            dateSubmitted: '2024-10-26T10:00:00Z',
            votes: 45
        },
        {
            id: '2',
            name: 'Cross-Chain Bridge Security Update',
            url: 'https://github.com/example/bridge-security',
            dateSubmitted: '2024-10-25T15:30:00Z',
            votes: 32
        },
        {
            id: '3',
            name: 'Zero-Knowledge Proof Integration',
            url: 'https://github.com/example/zk-proposal',
            dateSubmitted: '2024-10-24T09:15:00Z',
            votes: 28
        }
    ]);

// State for historical proposals TODO: connect to backend
    const [historicalProposals, setHistoricalProposals] = useState<HistoricalProposal[]>([
        {
            id: '0',
            name: 'Gas Optimization Protocol',
            url: 'https://github.com/example/gas-opt',
            dateSubmitted: '2024-10-12T10:00:00Z',
            dateImplemented: '2024-10-19T14:00:00Z',
            winningRound: 3,
            votes: 167
        },
        {
            id: '-1',
            name: 'Smart Contract Upgrade Mechanism',
            url: 'https://github.com/example/upgrade-mechanism',
            dateSubmitted: '2024-10-05T08:30:00Z',
            dateImplemented: '2024-10-12T16:00:00Z',
            winningRound: 2,
            votes: 143
        },
        {
            id: '-2',
            name: 'Decentralized Identity Framework',
            url: 'https://github.com/example/did-framework',
            dateSubmitted: '2024-09-28T11:45:00Z',
            dateImplemented: '2024-10-05T10:00:00Z',
            winningRound: 1,
            votes: 189
        }
    ]);
    // Timer update effect
    useEffect(() => {
        // TODO: Replace with actual round end time from backend
        const roundEndTime = new Date();
        roundEndTime.setHours(roundEndTime.getHours() + 24); // Example: 24h rounds

        const timerInterval = setInterval(() => {
            const now = new Date();
            const diff = roundEndTime.getTime() - now.getTime();

            if (diff <= 0) {
                // Round ended - TODO: Trigger round end handling
                clearInterval(timerInterval);
                return;
            }

            setTimeRemaining({
                hours: Math.floor(diff / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timerInterval);
    }, []);

    // Function to handle voting - TODO: eventually connect to smart contract?
    const handleVote = async (proposalId: string) => {
        try {
            // TODO: Connect to smart contract voting function
            console.log(`Voted for proposal ${proposalId}`);
            // Update local state to reflect vote
            setCurrentProposals(prevProposals =>
                prevProposals.map(proposal =>
                    proposal.id === proposalId
                        ? { ...proposal, votes: (proposal.votes || 0) + 1 }
                        : proposal
                )
            );
        } catch (error) {
            console.error('Voting failed:', error);
            // TODO: Add error handling UI
        }
    };

    // Format date helper function
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
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

            {/* Current Proposals */}
            <Card className="border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6" />
                        Active Proposals
                    </CardTitle>
                    <CardDescription>Vote on current round proposals</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {currentProposals.map((proposal) => (
                            <div key={proposal.id} className="glass p-4 rounded-lg space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold">{proposal.name}</h3>
                                        <a
                                            href={proposal.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-400 hover:text-blue-300"
                                        >
                                            View Source
                                        </a>
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        {formatDate(proposal.dateSubmitted)}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-400">
                                        {proposal.votes || 0} votes
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger className="cyberpunk-button-sm">
                                            Vote
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Confirm Vote</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to vote for "{proposal.name}"? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleVote(proposal.id)}>
                                                    Confirm Vote
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Historical Proposals */}
            <Card className="border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="w-6 h-6" />
                        Previous Winners
                    </CardTitle>
                    <CardDescription>Historical winning proposals</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {historicalProposals.map((proposal) => (
                            <div key={proposal.id} className="glass p-4 rounded-lg space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold">{proposal.name}</h3>
                                        <a
                                            href={proposal.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-400 hover:text-blue-300"
                                        >
                                            View Source
                                        </a>
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        Round {proposal.winningRound}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-400">
                                    <div>
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        Implemented: {formatDate(proposal.dateImplemented)}
                                    </div>
                                    <div>{proposal.votes} votes</div>
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