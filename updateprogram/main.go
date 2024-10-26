package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"time"

	bsclient "github.com/ipfs/boxo/bitswap/client"
	bsnet "github.com/ipfs/boxo/bitswap/network"
	bsserver "github.com/ipfs/boxo/bitswap/server"
	"github.com/ipfs/boxo/blockservice"
	"github.com/ipfs/boxo/blockstore"
	"github.com/ipfs/boxo/files"
	"github.com/ipfs/boxo/ipld/merkledag"
	unixfile "github.com/ipfs/boxo/ipld/unixfs/file"
	"github.com/ipfs/go-cid"
	"github.com/joho/godotenv"

	// "github.com/ethereum/go-ethereum"
	// "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ipfs/go-datastore"
	dsync "github.com/ipfs/go-datastore/sync"
	"github.com/libp2p/go-libp2p"
	routinghelpers "github.com/libp2p/go-libp2p-routing-helpers"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/multiformats/go-multiaddr"
)

func connectFromString(ctx context.Context, h host.Host, str string) {
	maddr, _ := multiaddr.NewMultiaddr(str)
	info, err := peer.AddrInfoFromP2pAddr(maddr)
	if err != nil {
		fmt.Println("Error getting info", err.Error())
		return
	}

	err = h.Connect(ctx, *info)
	if err == nil {
		fmt.Println("Connected to address:", str)
	} else {
		fmt.Println("Error connecting:", err.Error())
	}
}

func NewHost() host.Host {
	var h host.Host
	{
		priv, _, err := crypto.GenerateKeyPairWithReader(crypto.RSA, 2048, rand.Reader)
		if err != nil {
			panic(err)
		}

		opts := []libp2p.Option{
			libp2p.ListenAddrStrings(fmt.Sprintf("/ip4/%s/tcp/%d", "0.0.0.0", 0)),
			libp2p.Identity(priv),
		}

		h, err = libp2p.New(opts...)
		if err != nil {
			panic(err)
		}
	}

	return h
}

func nextEvent(ctx context.Context, client *ethclient.Client) string {
	// Actually just get the latest executed state and make sure we aren't already at that version.

	// contractAddress := common.HexToAddress("0x")
	// eventSignature := ""

	// query := ethereum.FilterQuery{
	// 	Addresses: []common.Address{},
	// 	Topics:    [][]common.Hash{[]common.Hash{common.HexToHash(eventSignature)}},
	// 	FromBlock: nil,
	// 	ToBlock:   nil,
	// }

	// Issue: Have to filter to begin with, then run the event loop.
	// logs, err := client.FilterLogs(ctx, query)

	// Get the event signature for the event.
	var str string
	fmt.Scanln(&str)

	return str

}

func main() {
	if err := godotenv.Load(); err != nil {
		panic("No .env file found.")
	}

	fmt.Println("Welcome to the client.")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	{
		// Make the host.
		h := NewHost()

		// XXX: Currently stores blocks in memory only.
		bstore := blockstore.NewBlockstore(dsync.MutexWrap(datastore.NewMapDatastore()))

		bsnet := bsnet.NewFromIpfsHost(h, routinghelpers.Null{})
		client := bsclient.New(ctx, bsnet, bstore)
		server := bsserver.New(ctx, bsnet, bstore)
		bservice := blockservice.New(bstore, client)
		bsnet.Start(client, server)

		addresses := strings.Split(os.Getenv("AUTOCONNECT_ADDRESSES"), " ")
		for i := range addresses {
			connectFromString(ctx, h, addresses[i])
		}

		// Get the actual frigging file.
		dataFromCid := func(c cid.Cid) ([]byte, error) {
			// HACK: Have to re-register the peers to force them to share files.
			// This should not be happening, most likely there is a subtle issue too complicated to debug.
			fmt.Println("Redconnecting")
			for _, peerId := range h.Network().Peers() {
				// XXX: Find a good timeout for reconnecting to old peers. Also find if there's a better way to handle this bitswap issue.
				ctx, cancel := context.WithTimeout(ctx, time.Second*5)
				defer cancel()

				fmt.Println("Disconnecting")
				err := bsnet.DisconnectFrom(ctx, peerId)
				if err != nil {
					fmt.Println("Failed to disconnect from:", peerId)
				}
			}

			// Force reconnect all the peers.
			for i := range addresses {
				connectFromString(ctx, h, addresses[i])
			}

			dserv := merkledag.NewReadOnlyDagService(merkledag.NewSession(ctx, merkledag.NewDAGService(bservice)))
			fmt.Println("Downloading...")
			// TODO: Add deadline
			nd, err := dserv.Get(ctx, c)
			if err != nil {
				return nil, err
			}

			unixFSNode, err := unixfile.NewUnixfsFile(ctx, dserv, nd)
			if err != nil {
				return nil, err
			}

			var buf bytes.Buffer
			if f, ok := unixFSNode.(files.File); ok {
				if _, err := io.Copy(&buf, f); err != nil {
					return nil, err
				}
			}
			return buf.Bytes(), nil
		}

		upgrade := func(str string) {
			c, err := cid.Parse(str)
			if err != nil {
				fmt.Println("Not a valid cid")
			} else {
				fmt.Println("Valid cid: ", str)
				bytes, err := dataFromCid(c)

				if err != nil {
					fmt.Println("Failed to parse cid: ", str)
				} else {
					fmt.Println("Success, got: ")
					fmt.Println(len(bytes))

					// Now we interpret as a binary file.

					// TODO: Check that it's an actual executable type.
					f, err := os.CreateTemp("", "exe-*.bin")
					if err != nil {
						panic(err)
					} else {
						{
							os.Chmod(f.Name(), 0755)

							_, err := f.Write(bytes)
							if err != nil {
								panic(err)
							}

							f.Close()
						}

						cmd := exec.Command(f.Name())
						cmd.Stdout = os.Stdout
						cmd.Stderr = os.Stderr

						if err := cmd.Run(); err != nil {
							panic(err)
						}
					}
				}
			}
		}

		{ // Event loop.
			ethClient, err := ethclient.Dial("https://rpc.ankr.com/eth")

			contract := ""

			// Get the first

			if err != nil {
				panic(err)
			} else {
				// Event loop.

				for {
					str := nextEvent(ctx, ethClient)
					fmt.Println("New event! ", str)

					upgrade(str)
				}
			}
		}
	}
}
