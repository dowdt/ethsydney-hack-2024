package main

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"log"
	"math/big"
	"math/rand"
	"os"
	"sync"
	"time"

	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	ethcrypto "github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"

	"github.com/gdamore/tcell"
)

const dragon = `
                                        
        :-@                 :.          
     @@@@@@@@*        .*  +@@@@         
    :@@@@@@=    .  ..@*    .@@@@@*      
    @@@@@@@     +@@@@@.    .@@@@@@@     
  .@@@@@@@      %%*@@*      *@@@@@@@    
 :@@@@@@@@     @@@@@         @@@@@@@@   
 +@@@@@@@@    @@@@+=         @@@@@@@#   
 +@@@@@@@@@    @   **@.  + .@@@@@@@@    
 :@@@@@- %@@-      @@@@* @@@%%%@@@@%    
  .@@@@@@-  +@-  %@@@@@* @:    +@@  +.  
    % -@@@    @  .@@@@@* @      .*      
          @      #@@@@*                 
                +@@@@    @              
                +@@@:   @:              
                +@@@@@   @@             
                 .@@@@.   +@*           
                 .@@@   %%@@*           
                   ++@@@+++             
`

type Wallet struct {
	PubKey  string
	Private *ecdsa.PrivateKey
	Balance *big.Int
	Checked bool
}

func genWallet() Wallet {
	time.Sleep(time.Millisecond * time.Duration(rand.Int()%10))
	privateKey, err := crypto.GenerateKey()
	if err != nil {
		log.Fatal(err)
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		log.Fatal("error casting public key to ECDSA")
	}

	publicKeyBytes := crypto.FromECDSAPub(publicKeyECDSA)
	hash := ethcrypto.Keccak256(publicKeyBytes)
	return Wallet{hexutil.Encode(hash[12:]), privateKey, big.NewInt(0), false}
}

func main() {
	s, err := tcell.NewScreen()
	if err != nil {
		log.Fatalf("%+v", err)
	}
	if err := s.Init(); err != nil {
		log.Fatalf("%+v", err)
	}

	// Set default text style
	defStyle := tcell.StyleDefault
	// s.SetStyle(defStyle)

	// Clear screen

	quit := func() {
		s.Fini()
		os.Exit(0)
	}

	grid := make([]rune, 13*7)

	setGridSolid := func(r rune) {
		for i := range grid {
			grid[i] = r
		}
	}

	setGridSpiral := func(step int, r rune, solid rune) {
		grid_cursor_x := 0
		grid_cursor_y := 0
		grid_cursor_dx := 1
		grid_cursor_dy := 0

		setGridSolid(solid)

		for range step {
			rotate := func() {
				if grid_cursor_dx > 0 {
					grid_cursor_dx = 0
					grid_cursor_dy = 1
				} else if grid_cursor_dx < 0 {
					grid_cursor_dx = 0
					grid_cursor_dy = -1
				} else if grid_cursor_dy > 0 {
					grid_cursor_dx = -1
					grid_cursor_dy = 0
				} else if grid_cursor_dy < 0 {
					grid_cursor_dx = 1
					grid_cursor_dy = 0
				}

			}

			i := grid_cursor_x + grid_cursor_y*13
			new_x := grid_cursor_x + grid_cursor_dx
			new_y := grid_cursor_y + grid_cursor_dy
			j := new_x + 13*new_y

			if new_x >= 13 || new_x < 0 || new_y >= 7 || new_y < 0 {
				rotate()
			} else if grid[j] == r {
				rotate()
			}

			grid[i] = r
			grid_cursor_x += grid_cursor_dx
			grid_cursor_y += grid_cursor_dy
		}
	}

	// Stages
	// 1. Generating wallets
	// 2. Check against select thingy
	// 3. Show cracked number
	stage := 0

	wallets := make([]Wallet, 0, 100000)
	quota := 1000

	checkedWallets := make([]Wallet, 100000)
	checkedWalletCount := func() int {
		count := 0
		for _, w := range checkedWallets {
			if w.Checked {
				count += 1
			}
		}
		return count
	}
	checkedWalletsEthCount := func() string {
		b := big.NewInt(0)
		for _, w := range checkedWallets {
			if w.Checked {
				b = b.Add(b, w.Balance)
			}
		}
		return b.String()
	}

	go func() {
		// Make wallets:

		for {
			switch {
			case stage == 0:
				// Generate new wallets
				wallets = append(wallets, genWallet())

				if len(wallets) >= quota {
					stage += 1
				}

			case stage == 1:
				// Check against subquery
				// c, err := ethclient.Dial("https://testnet.riselabs.xyz")
				/// XXX: We use http, because the certificate is DOWN! Lmao
				c, err := ethclient.Dial("http://ethereum-sepolia.rpc.subquery.network/public")
				// c, err := ethclient.Dial("https://rpc.ankr.com/eth_sepolia")

				if err != nil {
					panic("Error subquery offline!")
				} else {
					ctx := context.Background()

					var wg sync.WaitGroup

					checkWallet := func(i int) {
						addr := ethcrypto.PubkeyToAddress(wallets[0].Private.PublicKey)
						bal, err := c.BalanceAt(ctx, addr, nil)

						if err != nil {
							panic(err)
						} else {
							wallets[i].Balance = bal
							wallets[i].Checked = true
							checkedWallets[i] = wallets[i]

							if bal.Cmp(big.NewInt(0)) == 1 {
								// WTF, nonzero balance
							}
						}

						wg.Done()
					}

					count := 4
					for i := 0; i < len(wallets); i += count {
						// time.Sleep(time.Millisecond * 100)
						for j := 0; j < count; j++ {
							wg.Add(1)
							go checkWallet(i + j)
						}
						wg.Wait()
					}

					stage += 1
				}

			case stage == 2:
				time.Sleep(time.Second * 3)
				stage += 1
			case stage == 3:
				time.Sleep(time.Second * 3)
				wallets = make([]Wallet, 0, quota)
				checkedWallets = make([]Wallet, quota)
				stage = 0
			}
		}
	}()

	threeDots := ""

	go func() {
		for {
			threeDots = ""
			time.Sleep(time.Millisecond * 300)
			threeDots = "."
			time.Sleep(time.Millisecond * 300)
			threeDots = ".."
			time.Sleep(time.Millisecond * 300)
			threeDots = "..."
			time.Sleep(time.Millisecond * 300)
		}

	}()

	go func() {

		t := time.NewTicker(time.Millisecond * 30)
		for {
			select {
			case <-t.C:
				ev := tcell.NewEventInterrupt(0)

				switch {
				case stage == 0:
					setGridSolid('*')
					threshold := int((float64(len(grid)) * float64(len(wallets)) / float64(quota)))
					setGridSpiral(threshold, '@', '*')
				case stage == 1:
					setGridSolid('@')

					threshold := int((float64(len(grid)) * float64(checkedWalletCount()) / float64(len(wallets))))

					setGridSpiral(len(grid)-threshold, '@', '✓')
				case stage == 2:
					setGridSolid('X')
				}

				s.PostEvent(ev)
			}
		}
	}()

	drawDragon := func(xoff, yoff int) {
		for y := 0; y < 19; y++ {
			roff := 0
			if (rand.Int() % 100) > 98 {
				if rand.Int()%2 == 1 {
					roff = -1
				} else {
					roff = 1
				}
			}

			for x := 0; x < 41-roff; x++ {
				index := y*41 + x
				s.SetContent(xoff+roff+x, yoff+y, rune(dragon[index]), nil, defStyle)
			}
		}
	}

	drawBox := func(x, y, w, h int, filled bool) {

		if filled {
			for _x := x; _x < w; _x++ {
				for _y := y; _y < h; _y++ {
					s.SetContent(_x, _y, ' ', nil, defStyle)
				}
			}
		}

		for _x := x; _x <= x+w; _x++ {
			s.SetContent(_x, y, '-', nil, defStyle)
			s.SetContent(_x, y+h, '-', nil, defStyle)
		}
		for _y := y; _y <= y+h; _y++ {
			s.SetContent(x, _y, '|', nil, defStyle)
			s.SetContent(x+w, _y, '|', nil, defStyle)
		}
	}

	for {
		s.Clear()
		w, h := s.Size()

		drawDragon(1, 1)
		drawBox(0, 0, 42, 21, false)

		drawText := func(text string, y int) {
			s.SetContent((42+(w-42)/2)-(len(text)/2), y, ' ', []rune(text), defStyle)
		}

		title := "Alduin the Wallet Eater (Version 1.0)"
		drawText(title, 4)
		drawText("-----------", 5)
		drawText("Special edition", 6)
		drawText("-----------", 7)

		genProg := fmt.Sprintf("Generated %d/wallets", len(wallets))
		checkProg := fmt.Sprintf("Checked %d/wallets, Got %s ETH", checkedWalletCount(), checkedWalletsEthCount())
		sendProg := fmt.Sprintf("( ͡° ͜ʖ ͡°)")

		if stage == 0 {
			drawText("Step 1: Generating wallets"+threeDots, h-7)
			drawText(genProg, h-5)
		} else if stage == 1 {
			drawText("Step 1: Generating wallets ✓", h-11)
			drawText(genProg, h-9)

			drawText("Step 2: Checking against subquery™️"+threeDots, h-7)
			drawText(checkProg, h-5)
		} else if stage == 2 {
			drawText("Step 1: Generated wallets ✓", h-15)
			drawText(genProg, h-13)

			drawText("Step 2: Checking against subquery™️ ✓", h-11)
			drawText(checkProg, h-9)

			drawText("Step 3: Sending to DAO"+threeDots, h-7)
			drawText(sendProg, h-5)
		} else if stage == 3 {
			drawText("Step 1: Generated wallets ✓", h-15)
			drawText(genProg, h-13)

			drawText("Step 2: Checked against subquery™️ ✓", h-11)
			drawText(checkProg, h-9)

			drawText("Step 3: Sent to DAO ✓", h-7)
			drawText("(not really)", h-5)
		}

		s_y := h - 15
		drawBox(0, s_y, 42, 14, true)
		// Draw the number of checked passwords.

		for x := 0; x < 13; x++ {
			for y := 0; y < 7; y++ {
				index := y*13 + x
				rune := grid[index]

				s.SetContent(3+x*3, y*2+s_y+1, rune, nil, defStyle)
			}
		}

		// Draw the wallets as they're generated.

		// draw the latest 10 wallets

		for i := 0; i < 24; i++ {

			c := checkedWalletCount()
			if i+c < len(wallets) {
				i2 := 0
				if len(wallets) > i+c {
					i2 = c
				}

				w := wallets[len(wallets)-i2-i-1].PubKey
				drawText(w, i+h/2-30/2+1)
			}
		}

		drawText("/-----\\", h/2-30/2)
		drawText("\\-----/", h/2-30/2+25)
		// drawBox((42+(w-42)/2)-(45/2), h/2-30/2, 46, 25, false)

		s.Show()

		// Poll event
		ev := s.PollEvent()

		// Process event
		switch ev := ev.(type) {
		case *tcell.EventResize:
			s.Sync()
		case *tcell.EventInterrupt:
			s.Sync()
		case *tcell.EventKey:
			if ev.Key() == tcell.KeyEscape || ev.Key() == tcell.KeyCtrlC {
				quit()
			}
		}
	}
}
