"use client"

import React, { useState } from 'react'

import Web3Modal from "web3modal";
import { ethers } from "ethers";

// TEST

// const customChainId = 1337; // Your custom chain ID
// const customRpcUrl = "https://my-custom-rpc-url.com"; // Your custom RPC URL

// const providerOptions = {
//   walletconnect: {
//     package: () => import("@walletconnect/web3-provider"),
//     options: {
//       rpc: {
//         [customChainId]: customRpcUrl,
//       },
//       chainId: customChainId,
//     }
//   }
// };


export default function App() {
    const [provider, setProvider] = useState<ethers.BrowserProvider|null>(null);
    const [account, setAccount] = useState<string>("");
    const [transactionHash, setTransactionHash] = useState<string>("");

    const web3Modal = new Web3Modal({
        network: "mainnet",
        cacheProvider: false,
        providerOptions: {
            metamask: {
                package: null
            }
        }
    });

    const connectWallet = async () => {
        try {
            // const web3Modal = new Web3Modal({
            //     network: "custom",
            //     cacheProvider: true,
            //     providerOptions,
            // });

            const instance = await web3Modal.connect();
            const web3Provider = new ethers.BrowserProvider(instance);
            setProvider(web3Provider);

            const signer = await web3Provider.getSigner();
            const address = await signer.getAddress();
            setAccount(address);
            console.log("Connected to address:", address);

        } catch (error) {
            console.error("Failed to connect wallet:", error);
        }
    }

    // const disconnectWallet = async () => {
    //     if (provider) {
    //         web3Modal.clearCachedProvider()
    //         provider.destroy()
    //         setProvider(null)
    //         setAccount("")
    //     }
    // }


    return (
        <div>
            {
                account != "" ? (
                    <>
                        <p> {account} </p>
                        <p> Connected with metamask, disconnect through their extension if you want I guess. </p>

                    </>
                ) : (
                    <button onClick={connectWallet}> Connect wallet </button>
                )
            }
        </div>
    )
}
