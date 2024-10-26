"use client";

import React, { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import VotingInterface from "./VotingInterface";
import { ContractService } from "@/services/contractService";
import WalletConnectProvider from "@walletconnect/web3-provider";

export default function App() {
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [account, setAccount] = useState<string>("");
    const [activeTab, setActiveTab] = useState<'submit' | 'vote'>('submit');
    const [hasNFT, setHasNFT] = useState<boolean>(false);
    const [proposalName, setProposalName] = useState<string>("");
    const [sourceURL, setSourceURL] = useState<string>("");
    const [targetId, setTargetId] = useState<string>("");
    const [exeCID, setExeCID] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [contractService, setContractService] = useState<ContractService | null>(null);

    const web3Modal = new Web3Modal({
        cacheProvider: true, // Enable this to keep the provider cached
        providerOptions: {
            walletconnect: {
                package: WalletConnectProvider,
                options: {
                    rpc: {
                        11155931: "https://testnet.riselabs.xyz", // Custom Rise Sepolia RPC URL
                    },
                    chainId: 11155931,
                },
            },
        },
    });
    const connectWallet = async () => {
        try {
            setIsLoading(true);
            const instance = await web3Modal.connect();
            const web3Provider = new ethers.BrowserProvider(instance);
            setProvider(web3Provider);

            instance.on("accountsChanged", () => window.location.reload());
            instance.on("chainChanged", () => window.location.reload());
            instance.on("disconnect", () => disconnectWallet());

            const signer = await web3Provider.getSigner();
            const address = await signer.getAddress();
            setAccount(address);

            const { chainId } = await web3Provider.getNetwork();
            if (chainId.toString() !== "11155931") {
                // Prompt to add or switch to "Rise Sepolia" if not on the correct network
                await addRiseSepoliaNetwork(instance);
            }

            checkForNFT(address);
            const service = new ContractService(signer);
            setContractService(service);

            console.log("Connected to address:", address);
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const addRiseSepoliaNetwork = async (web3Provider: any) => {
        const params = {
            chainId: "0xAAAFDB", // Hex representation of 11155931
            chainName: "Rise Sepolia",
            rpcUrls: ["https://testnet.riselabs.xyz"],
            nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
            },
            blockExplorerUrls: ["https://testnet-explorer.riselabs.xyz"],
        };

        try {
            await web3Provider.request({
                method: "wallet_addEthereumChain",
                params: [params],
            });
        } catch (error) {
            console.error("Failed to add or switch to Rise Sepolia network:", error);
        }
    };

    const disconnectWallet = () => {
        web3Modal.clearCachedProvider();
        setProvider(null);
        setAccount("");
        setHasNFT(false);
    };

    const checkForNFT = async (address: string) => {
        // TODO: Implement actual NFT check for voting rights
        setHasNFT(true); // Placeholder: set to true for testing
    };

    const handleProposalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proposalName || !exeCID) {
            alert("Please complete all required fields.");
            return;
        }

        if (!contractService) {
            console.error("Contract service is not initialized.");
            return;
        }

        try {
            setIsLoading(true);
            console.log("Submitting proposal:", { proposalName, sourceURL, targetId, exeCID, proposer: account });

            // Submitting the proposal
            await contractService.propose(
                ["0x1069696934567890ABCDef123456789F12345678"],
                [0],
                [exeCID],
                ethers.keccak256(Buffer.from(proposalName))
            );

            alert("Proposal submitted successfully!");
            setProposalName("");
            setSourceURL("");
            setTargetId("");
            setExeCID("");
        } catch (error) {
            console.error("Failed to submit proposal", error);
            alert("Failed to submit proposal. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (provider) {
            const initContractService = async () => {
                const signer = await provider.getSigner();
                setContractService(new ContractService(signer));
            };
            initContractService();
        }
    }, [provider]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-shapes">
                <div className="glass glow max-w-lg w-full p-8 rounded-xl text-center">
                    <h1 className="text-2xl text-gray-200">Connecting...</h1>
                </div>
            </div>
        );
    }

    if (!account) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-shapes">
                <div className="glass glow max-w-lg w-full p-8 rounded-xl text-center">
                    <h1 className="text-5xl font-bold gradient-text mb-4">DAOputer</h1>
                    <p className="text-xl text-gray-200 mb-8">
                        Decentralized Computation Governance Platform
                    </p>
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
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center space-x-8">
                            <h1 className="text-4xl font-bold gradient-text">DAOputer</h1>
                            <div className="hidden md:flex space-x-6">
                                <button
                                    className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'submit' ? 'bg-white/10 text-white' : 'text-gray-300 hover:text-white'}`}
                                    onClick={() => setActiveTab('submit')}
                                >
                                    Submit
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'vote' ? 'bg-white/10 text-white' : 'text-gray-300 hover:text-white'} ${!hasNFT ? 'opacity-50 cursor-not-allowed' : ''}`}
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

            <div className="max-w-6xl mx-auto p-4">
                <div className="glass glow rounded-xl p-8 mb-6 mt-6">
                    <div className="md:hidden flex space-x-4 mb-6">
                        <button
                            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${activeTab === 'submit' ? 'bg-white/10 text-white' : 'text-gray-300 hover:text-white'}`}
                            onClick={() => setActiveTab('submit')}
                        >
                            Submit
                        </button>
                        <button
                            className={`flex-1 px-4 py-2 rounded-lg transition-colors ${activeTab === 'vote' ? 'bg-white/10 text-white' : 'text-gray-300 hover:text-white'} ${!hasNFT ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                            />
                            <input
                                className="cyber-input w-full"
                                placeholder="Target ID"
                                value={targetId}
                                onChange={(e) => setTargetId(e.target.value)}
                            />
                            <input
                                className="cyber-input w-full"
                                placeholder="Executable CID"
                                value={exeCID}
                                onChange={(e) => setExeCID(e.target.value)}
                                required
                            />
                            <button type="submit" className="cyberpunk-button w-full">
                                Submit Proposal
                            </button>
                        </form>
                    )}

                    {activeTab === 'vote' && !hasNFT && (
                        <div className="glass p-4 text-red-300 rounded-lg">
                            You need to own the required NFT to participate in voting.
                        </div>
                    )}

                    {activeTab === 'vote' && hasNFT && contractService && (
                        <VotingInterface contractService={contractService} />
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
