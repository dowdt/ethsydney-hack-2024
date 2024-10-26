"use client"

import React, { useState, useEffect } from 'react'
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import VotingInterface from './VotingInterface';

export default function App() {
    const [provider, setProvider] = useState<ethers.BrowserProvider|null>(null);
    const [account, setAccount] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'submit'|'vote'>('submit');
    const [hasNFT, setHasNFT] = useState<boolean>(false);
    const [proposalName, setProposalName] = useState<string>("");
    const [sourceURL, setSourceURL] = useState<string>("");
    const [targetId, setTargetId] = useState<string>("");
    const [exeCID, setExeCID] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    const web3Modal = new Web3Modal({
        network: "mainnet", // TODO: connect to actual network
        cacheProvider: false, // Changed to false to prevent auto-connecting
        providerOptions: {
            metamask: {
                package: null
            }
        }
    });

    const connectWallet = async () => {
        try {
            setIsLoading(true);
            const instance = await web3Modal.connect();
            const web3Provider = new ethers.BrowserProvider(instance);
            setProvider(web3Provider);

            // Subscribe to provider events
            instance.on("accountsChanged", () => {
                window.location.reload();
            });

            instance.on("chainChanged", () => {
                window.location.reload();
            });

            instance.on("disconnect", () => {
                disconnectWallet();
            });

            const signer = await web3Provider.getSigner();
            const address = await signer.getAddress();
            setAccount(address);
            checkForNFT(address);

            // Initialize ContractService
            setContractService(new ContractService(signer));

            console.log("Connected to address:", address);
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        } finally {
            setIsLoading(false);
        }
    }

    const disconnectWallet = () => {
        web3Modal.clearCachedProvider();
        setProvider(null);
        setAccount("");
        setHasNFT(false);
    };

    const checkForNFT = async (address: string) => {
        // TODO: Implement actual NFT check for voting rights
        setHasNFT(true); // Placeholder: set to true for testing
    }

    const handleProposalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submitting proposal:", {
            name: proposalName,
            sourceURL,
            targetId,
            exeCID,
            proposer: account
        });
    }

    // Show loading state while connecting
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-shapes">
                <div className="glass glow max-w-lg w-full p-8 rounded-xl text-center">
                    <h1 className="text-2xl text-gray-200">Connecting...</h1>
                </div>
            </div>
        );
    }

    // Landing page when not connected
    if (!account) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-shapes">
                <div className="glass glow max-w-lg w-full p-8 rounded-xl text-center">
                    <h1 className="text-5xl font-bold gradient-text mb-4">DAOputer</h1>
                    <p className="text-xl text-gray-200 mb-8">
                        Decentralized Computation Governance Platform
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="glass p-6 rounded-lg hover:scale-105 transition-transform">
                            <h3 className="text-xl font-semibold text-white mb-2">Submit Proposals</h3>
                            <p className="text-gray-300">Anyone can submit computational proposals to the network</p>
                        </div>
                        <div className="glass p-6 rounded-lg hover:scale-105 transition-transform">
                            <h3 className="text-xl font-semibold text-white mb-2">Vote on Changes</h3>
                            <p className="text-gray-300">NFT holders can participate in governance decisions</p>
                        </div>
                    </div>
                    <button
                        onClick={connectWallet}
                        className="cyberpunk-button w-full"
                    >
                        Connect Wallet to Begin
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-shapes">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-8">
                            <h1 className="text-4xl font-bold gradient-text">DAOputer</h1>
                            <div className="hidden md:flex space-x-6">
                                <button
                                    className={`px-4 py-2 rounded-lg transition-colors ${
                                        activeTab === 'submit'
                                            ? 'bg-white/10 text-white'
                                            : 'text-gray-300 hover:text-white'
                                    }`}
                                    onClick={() => setActiveTab('submit')}
                                >
                                    Submit
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-lg transition-colors ${
                                        activeTab === 'vote'
                                            ? 'bg-white/10 text-white'
                                            : 'text-gray-300 hover:text-white'
                                    } ${!hasNFT ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => hasNFT ? setActiveTab('vote') : null}
                                >
                                    Vote
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {hasNFT && (
                                <span className="hidden md:inline-block px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                                    NFT Holder
                                </span>
                            )}
                            <div className="glass px-4 py-2 rounded-lg flex items-center space-x-4">
                                <span className="text-sm text-gray-300">
                                    {account.slice(0, 6)}...{account.slice(-4)}
                                </span>
                                <button
                                    onClick={disconnectWallet}
                                    className="text-sm text-red-300 hover:text-red-400"
                                >
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto p-4">
                <div className="glass glow rounded-xl p-8 mb-6 mt-6">
                    {/* Mobile Tabs */}
                    <div className="md:hidden flex space-x-4 mb-6">
                        <button
                            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                                activeTab === 'submit'
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-300 hover:text-white'
                            }`}
                            onClick={() => setActiveTab('submit')}
                        >
                            Submit
                        </button>
                        <button
                            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                                activeTab === 'vote'
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-300 hover:text-white'
                            } ${!hasNFT ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => hasNFT ? setActiveTab('vote') : null}
                        >
                            Vote
                        </button>
                    </div>

                    {activeTab === 'submit' && (
                        <form onSubmit={handleProposalSubmit} className="space-y-5">
                            <input
                                className="cyber-input w-full"
                                placeholder="Proposal Name"
                                value={proposalName}
                                onChange={(e) => setProposalName(e.target.value)}
                                required
                            />
                            <input
                                className="cyber-input w-full"
                                placeholder="Source URL (GitHub)"
                                value={sourceURL}
                                onChange={(e) => setSourceURL(e.target.value)}
                                required
                            />
                            <input
                                className="cyber-input w-full"
                                placeholder="Target ID"
                                value={targetId}
                                onChange={(e) => setTargetId(e.target.value)}
                                required
                            />
                            <input
                                className="cyber-input w-full"
                                placeholder="Executable CID"
                                value={exeCID}
                                onChange={(e) => setExeCID(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                className="cyberpunk-button w-full"
                            >
                                Submit Proposal
                            </button>
                        </form>
                    )}

                    {activeTab === 'vote' && !hasNFT && (
                        <div className="glass p-4 text-red-300 rounded-lg">
                            You need to own the required NFT to participate in voting.
                        </div>
                    )}

                    {activeTab === 'vote' && hasNFT && (
                        <VotingInterface />
                    )}
                </div>
            </div>
            <div className="w-full py-8 flex items-center justify-center bg-black/30 backdrop-blur-sm border-t border-white/10">
                <div className="flex items-center gap-4">
                    <span className="text-xl text-gray-300">Powered by</span>
                    <img
                        src="/rise-logo.png"
                        alt="RISE Logo"
                        className="h-12 object-contain hover:scale-105 transition-transform"
                    />
                </div>
            </div>
        </div>
    );
}
