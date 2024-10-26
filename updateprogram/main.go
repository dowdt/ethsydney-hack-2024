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

func main() {
	if err := godotenv.Load(); err != nil {
		panic("No .env file found.")
	}

	fmt.Println("Welcome to the client.")

	// Import boxo
	// Event loop
	// If the event is happens, then we download cid from ipfs
	// We also seed the thing, why not?
	// Once we finish executing, we run another version of the target program with exec
	// On fail, we re-run the program X-many times

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
			dserv := merkledag.NewReadOnlyDagService(merkledag.NewSession(ctx, merkledag.NewDAGService(bservice)))
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

		{ // Event loop.
			for {
				str := ""
				fmt.Scanln(&str)
				fmt.Println("New event! ", str)

				c, err := cid.Parse(str)
				if err != nil {
					fmt.Println("Not a valid cid")
				} else {
					fmt.Println("Parsing:", str)
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
		}
	}
}
