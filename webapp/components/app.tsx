"use client"

import React, { useState } from 'react'
import Web3Modal from "web3modal";
import { ethers } from "ethers";

export default function App() {
    const [provider, setProvider] = useState<ethers.BrowserProvider|null>(null);
    const [account, setAccount] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'submit'|'vote'>('submit');
    const [hasNFT, setHasNFT] = useState<boolean>(false);
    const [proposalName, setProposalName] = useState<string>("");
    const [sourceURL, setSourceURL] = useState<string>("");
    const [targetId, setTargetId] = useState<string>("");
    const [exeCID, setExeCID] = useState<string>("");
    const [metadataCID, setMetadataCID] = useState<string>("");

    const web3Modal = new Web3Modal({
        network: "mainnet", // TODO: connect to actual network
        cacheProvider: false,
        providerOptions: {
            metamask: {
                package: null
            }
        }
    });

    const connectWallet = async () => {
        try {
            const instance = await web3Modal.connect();
            const web3Provider = new ethers.BrowserProvider(instance);
            setProvider(web3Provider);

            const signer = await web3Provider.getSigner();
            const address = await signer.getAddress();
            setAccount(address);
            checkForNFT(address);
            console.log("Connected to address:", address);
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        }
    }

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
            metadataCID,
            proposer: account
        });
    }

    // Landing page when not connected
    if (!account) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="glass max-w-lg w-full p-8 rounded-xl text-center">
                    <h1 className="text-5xl font-bold gradient-text mb-4">DAOputer</h1>
                    <p className="text-xl text-gray-200 mb-8">
                        Decentralized Computation Governance Platform
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="glass p-6 rounded-lg">
                            <h3 className="text-xl font-semibold text-white mb-2">Submit Proposals</h3>
                            <p className="text-gray-300">Anyone can submit computational proposals to the network</p>
                        </div>
                        <div className="glass p-6 rounded-lg">
                            <h3 className="text-xl font-semibold text-white mb-2">Vote on Changes</h3>
                            <p className="text-gray-300">NFT holders can participate in governance decisions</p>
                        </div>
                    </div>
                    <button
                        onClick={connectWallet}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Connect Wallet to Begin
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="glass rounded-xl p-8 mb-6">
                <div className="flex items-center justify-between p-4 rounded-lg mb-6 glass">
                    <span>Connected: {account}</span>
                    {!hasNFT && activeTab === 'vote' && (
                        <span className="text-yellow-300">⚠️ NFT required for voting</span>
                    )}
                </div>

                <div className="flex space-x-4 border-b border-white/10 mb-6">
                    <button
                        className={`px-6 py-3 text-gray-300 hover:text-white transition-colors
                            ${activeTab === 'submit' ? 'border-b-2 border-blue-500 text-white' : ''}`}
                        onClick={() => setActiveTab('submit')}
                    >
                        Submit Proposal
                    </button>
                    <button
                        className={`px-6 py-3 text-gray-300 hover:text-white transition-colors
                            ${activeTab === 'vote' ? 'border-b-2 border-blue-500 text-white' : ''}
                            ${!hasNFT ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => hasNFT ? setActiveTab('vote') : null}
                        title={!hasNFT ? "NFT required for voting" : ""}
                    >
                        Vote on Proposals
                    </button>
                </div>

                {activeTab === 'submit' && (
                    <form onSubmit={handleProposalSubmit} className="space-y-5">
                        <input
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                            placeholder="Proposal Name"
                            value={proposalName}
                            onChange={(e) => setProposalName(e.target.value)}
                            required
                        />
                        <input
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                            placeholder="Source URL (GitHub)"
                            value={sourceURL}
                            onChange={(e) => setSourceURL(e.target.value)}
                            required
                        />
                        <input
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                            placeholder="Target ID (hex)"
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            required
                        />
                        <input
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                            placeholder="Executable CID"
                            value={exeCID}
                            onChange={(e) => setExeCID(e.target.value)}
                            required
                        />
                        <input
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white"
                            placeholder="Metadata CID"
                            value={metadataCID}
                            onChange={(e) => setMetadataCID(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Submit Proposal
                        </button>
                    </form>
                )}

                {activeTab === 'vote' && !hasNFT && (
                    <div className="p-4 bg-red-500/10 text-red-300 rounded-lg">
                        You need to own the required NFT to participate in voting.
                    </div>
                )}

                {activeTab === 'vote' && hasNFT && (
                    <div className="text-center p-8 text-gray-400">
                        Voting interface will be implemented in a future update
                    </div>
                )}
            </div>
        </div>
    );
}