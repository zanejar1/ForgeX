# Forgex

Forgex is a minimal, wallet-first dApp to create and manage ERC-20 coins and ERC-721 NFT collections on EVM networks (built and tested on Sepolia). It focuses on a fast creation flow, simple max-supply controls, and a clean manage screen for minting and quick checks.

**Highlights**
- Create ERC-20 with name, symbol, initial supply, and max supply (cap enforced on-chain)
- Create ERC-721 collections from a single artwork CID (IPFS); metadata auto-generated and stored as a data: JSON URI
- Auto-mints token #0 on NFT deployment; consistent metadata across mints
- Manage view for both: on-chain reads, mint actions with cap checks, owner-aware flows
- Local persistence of deployed addresses; one-click Etherscan and copy

**Architecture**
- Frontend: React + Vite + Tailwind (wallet connect, Create, Manage)
- Contracts: Hardhat (OpenZeppelin ERC-20/721 + Ownable), compiled to artifacts
- ABIs: Synced into `frontend/src/abis` via a small script
- Storage: LocalStorage for deployed addresses; all details read on-chain

**Smart Contracts**
- `ERC20Token`
	- `constructor(name, symbol, initialSupplyWhole, maxSupplyWhole)`; enforces `initial <= max`
	- `mint(address to, uint256 amountWhole)` owner-only; max supply enforced in base units
	- Standard ERC-20 methods via OpenZeppelin
- `ERC721NFT`
	- `constructor(name, symbol, tokenURIInit, maxSupply)`; mints tokenId 0 with `tokenURIInit`
	- `mint()` mints to caller with the collection’s metadata; `mintTo(address)` owner-only
	- `nextTokenId()` and `maxSupply()` views; `tokenURI(id)` standard

**Data Persistence**
- Local only: `localStorage` keys per network
	- `fgx:erc20:<chainId>` and `fgx:erc721:<chainId>` → arrays of addresses (newest first)
	- All other details are fetched from the chain each time

**Getting Started**
1) Install deps

```powershell
# Frontend
cd frontend
npm install

# Smart contracts
cd ..\Smart-contracts
npm install
```

2) Compile contracts (Sepolia-compatible)

```powershell
cd Smart-contracts
npx hardhat compile
```

3) Sync ABIs to the frontend

```powershell
cd ..
node .\scripts\sync-abis.js
```

4) Run the frontend

```powershell
cd frontend
npm run dev
```

Open the app in your browser (Vite will print the local URL). Connect MetaMask and ensure you’re on Sepolia. Fund your account with test ETH for gas.

**Usage**
- Create Coin: set name, symbol, initial supply, and max supply; deploy. The address is saved locally for Manage.
- Create NFT: paste your artwork IPFS CID. The app generates ERC-721 metadata as a data: JSON URI with `image: ipfs://<CID>` and auto-mints token #0.
- Manage: lists saved contracts, reads on-chain data, and enables minting
	- Coins: mint to recipient with amount; enforces cap
	- NFTs: owner can `mintTo(recipient)`; non-owners can self-mint if supported

**Notes**
- Network: built against Sepolia; other networks may require minor config.
- Saved addresses are per-chain. Clear them via browser DevTools → Application → Local Storage.
- If you update contracts, re-run compile and ABI sync before rebuilding the frontend.

**Folders**
- `frontend/` React app (Create & Manage UI)
- `Smart-contracts/` Hardhat project (contracts, artifacts)
- `scripts/sync-abis.js` copies `abi` and `bytecode` into `frontend/src/abis`

—
Forgex — “The EVM tokens forge”
