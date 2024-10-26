"use client"

import React, { useState } from 'react'
import Web3Modal from "web3modal";
import { ethers } from "ethers";

export default function App() {
    // Existing wallet connection states
    const [provider, setProvider] = useState<ethers.BrowserProvider|null>(null);
    const [account, setAccount] = useState<string>("");

    // New states for DAO functionality
    const [activeTab, setActiveTab] = useState<'submit'|'vote'>('submit');
    const [hasNFT, setHasNFT] = useState<boolean>(false);
    const [proposalName, setProposalName] = useState<string>("");
    const [sourceURL, setSourceURL] = useState<string>("");
    const [targetId, setTargetId] = useState<string>("");
    const [exeCID, setExeCID] = useState<string>("");
    const [metadataCID, setMetadataCID] = useState<string>("");

    // Your existing Web3Modal configuration
    const web3Modal = new Web3Modal({
        network: "mainnet",
        cacheProvider: false,
        providerOptions: {
            metamask: {
                package: null
            }
        }
    });

    // Your existing connect wallet function
    const connectWallet = async () => {
        try {
            const instance = await web3Modal.connect();
            const web3Provider = new ethers.BrowserProvider(instance);
            setProvider(web3Provider);

            const signer = await web3Provider.getSigner();
            const address = await signer.getAddress();
            setAccount(address);

            // Add NFT check after wallet connection (placeholder)
            checkForNFT(address);
            console.log("Connected to address:", address);

        } catch (error) {
            console.error("Failed to connect wallet:", error);
        }
    }

    // New function to check for NFT ownership
    const checkForNFT = async (address: string) => {
        // TODO: Implement actual NFT check logic
        setHasNFT(true); // Placeholder: set to true for testing
    }

    // Handle proposal submission
    const handleProposalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement backend connection
        console.log("Submitting proposal:", {
            name: proposalName,
            sourceURL,
            targetId,
            exeCID,
            metadataCID,
            proposer: account
        });
    }

    // Basic styles for the DAO interface
    const styles = {
        container: 'max-w-4xl mx-auto p-4',
        card: 'bg-white rounded-lg shadow-md p-6 mb-4',
        header: 'border-b pb-4 mb-4',
        title: 'text-2xl font-bold',
        subtitle: 'text-gray-600',
        tabs: 'flex border-b mb-4',
        tab: 'px-4 py-2 cursor-pointer',
        activeTab: 'border-b-2 border-blue-500',
        form: 'space-y-4',
        input: 'w-full p-2 border rounded',
        button: 'w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600',
        alert: 'bg-red-100 text-red-700 p-4 rounded mb-4',
        connected: 'bg-green-100 text-green-700 p-4 rounded mb-4'
    };

    // If not connected, show connect button
    if (!account) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <button className={styles.button} onClick={connectWallet}>
                        Connect Wallet
                    </button>
                </div>
            </div>
        );
    }

    // If no NFT, show warning
    if (!hasNFT) {
        return (
            <div className={styles.container}>
                <div className={styles.alert}>
                    You need to own the required NFT to participate in this DAO.
                </div>
            </div>
        );
    }

    // Main DAO interface
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {/* Connected Account Banner */}
                <div className={styles.connected}>
                    Connected: {account}
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'submit' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('submit')}
                    >
                        Submit Proposal
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'vote' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('vote')}
                    >
                        Vote on Proposals
                    </button>
                </div>

                {/* Submit Proposal Form */}
                {activeTab === 'submit' && (
                    <form onSubmit={handleProposalSubmit} className={styles.form}>
                        <input
                            className={styles.input}
                            placeholder="Proposal Name"
                            value={proposalName}
                            onChange={(e) => setProposalName(e.target.value)}
                            required
                        />
                        <input
                            className={styles.input}
                            placeholder="Source URL (GitHub)"
                            value={sourceURL}
                            onChange={(e) => setSourceURL(e.target.value)}
                            required
                        />
                        <input
                            className={styles.input}
                            placeholder="Target ID (hex)"
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                            required
                        />
                        <input
                            className={styles.input}
                            placeholder="Executable CID"
                            value={exeCID}
                            onChange={(e) => setExeCID(e.target.value)}
                            required
                        />
                        <input
                            className={styles.input}
                            placeholder="Metadata CID"
                            value={metadataCID}
                            onChange={(e) => setMetadataCID(e.target.value)}
                            required
                        />
                        <button type="submit" className={styles.button}>
                            Submit Proposal
                        </button>
                    </form>
                )}

                {/* Voting Interface Placeholder */}
                {activeTab === 'vote' && (
                    <div className="text-center p-8 text-gray-500">
                        Voting interface will be implemented in a future update
                    </div>
                )}
            </div>
        </div>
    );
}