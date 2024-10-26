// app/proposals/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { ContractService } from "@/services/contractService";
import styles from "./page.module.css";  // Import the CSS module

export default function ProposalsPage() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string>("");
  const [contractService, setContractService] = useState<ContractService | null>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalId, setProposalId] = useState<string | null>(null); // Handle proposalId as a string
  const [isExecutable, setIsExecutable] = useState<boolean | null>(null);
  const [voteCounts, setVoteCounts] = useState<{ forVotes: number; againstVotes: number; abstainVotes: number } | null>(null);

  const fetchProposalVotes = async () => {
    if (contractService && proposalId) {
      try {
        const votes = await contractService.getProposalVotes(proposalId);
        setVoteCounts(votes);
      } catch (error) {
        console.error("Failed to fetch proposal votes:", error);
      }
    }
  };
  


  const web3Modal = new Web3Modal({
    network: "mainnet",
    cacheProvider: true,
    providerOptions: {}
  });

  const initContractService = async (web3Provider: ethers.BrowserProvider, instance: any) => {
    const signer = await web3Provider.getSigner();
    const address = await signer.getAddress();
    setProvider(web3Provider);
    setSigner(signer);
    setAccount(address);
    setContractService(new ContractService(signer));

    instance.on("accountsChanged", () => window.location.reload());
    instance.on("chainChanged", () => window.location.reload());
    instance.on("disconnect", () => {
      web3Modal.clearCachedProvider();
      window.location.reload();
    });
  };

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (web3Modal.cachedProvider) {
        try {
          const instance = await web3Modal.connectTo(web3Modal.cachedProvider);
          const web3Provider = new ethers.BrowserProvider(instance);
          await initContractService(web3Provider, instance);
        } catch (error) {
          console.error("Failed to reconnect:", error);
          web3Modal.clearCachedProvider();
        }
      }
    };

    checkWalletConnection();
  }, []);

  const connectWallet = async () => {
    try {
      const instance = await web3Modal.connect();
      const web3Provider = new ethers.BrowserProvider(instance);
      await initContractService(web3Provider, instance);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const fetchProposals = async () => {
    if (contractService) {
      try {
        const proposals = await contractService.getCreatedProposals();
        // Ensure all proposal IDs are strings
        const formattedProposals = proposals.map((proposal) => ({
          ...proposal,
          proposalId: proposal.proposalId.toString(),
        }));
        setProposals(formattedProposals);
      } catch (error) {
        console.error("Failed to fetch proposals:", error);
      }
    }
  };

  const checkIfExecutable = async () => {
    if (contractService && proposalId) {
    
      // Ensure proposalId is prefixed with 0x
    //   const formattedProposalId = proposalId.startsWith("0x") ? proposalId : `0x${proposalId}`;
    //   console.log("Formatted Proposal ID:", formattedProposalId);

      try {
        const executable = await contractService.isProposalExecutable(proposalId);
        setIsExecutable(executable);
      } catch (error) {
        console.error("Failed to check proposal executability:", error);
      }
    }
  };

  const executeProposal = async () => {
    if (contractService && proposalId) {
      try {
        const tx = await contractService.executeProposal(proposalId);
        await tx.wait();
        console.log("Proposal executed: ", tx.hash);
      } catch (error) {
        console.error("Failed to execute proposal:", error);
      }
    }
  };

  useEffect(() => {
    if (contractService) fetchProposals();
  }, [contractService]);

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.title}>Proposals Page</h1>

      {!account ? (
        <button onClick={connectWallet} className={styles.cyberpunkButton}>
          Connect Wallet
        </button>
      ) : (
        <>
          <div>
            <p className={styles.text}>Connected Account: {account.slice(0, 6)}...{account.slice(-4)}</p>
          </div>

          <button onClick={fetchProposalVotes} className={styles.button}>Fetch Proposal Votes</button>

        {voteCounts && (
          <div>
            <p>Votes For: {voteCounts.forVotes}</p>
            <p>Votes Against: {voteCounts.againstVotes}</p>
            <p>Votes Abstained: {voteCounts.abstainVotes}</p>
          </div>
        )}

          <div style={{ marginBottom: "20px" }}>
            <button onClick={fetchProposals} className={styles.button}>Fetch Proposals</button>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <select
              value={proposalId ?? ""}
              onChange={(e) => setProposalId(e.target.value)} // Set proposalId as string directly
              className={styles.select}
            >
              <option value="" disabled>Select a Proposal ID</option>
              {proposals.map((proposal, index) => (
                <option key={index} value={proposal.proposalId}>
                  Proposal ID: {proposal.proposalId}
                </option>
              ))}
            </select>
            <button onClick={checkIfExecutable} className={styles.button}>Check if Executable</button>
            {isExecutable !== null && (
              <p className={styles.text}>{isExecutable ? "Proposal is executable" : "Proposal is not executable"}</p>
            )}
            {isExecutable && (
              <button onClick={executeProposal} className={styles.button}>Execute Proposal</button>
            )}
          </div>

          <h2 className={styles.subtitle}>Created Proposals</h2>
          <ul className={styles.proposalList}>
            {proposals.map((proposal, index) => (
              <li key={index} className={styles.proposalItem}>
                <p>Proposal ID: {proposal.proposalId}</p>
                <p>Proposer: {proposal.proposer}</p>
                <p>Targets: {proposal.targets.join(", ")}</p>
                <p>Description: {proposal.description}</p>
                <p> Votes: {}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
