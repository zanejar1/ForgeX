// Network metadata
export const CHAINS = {
	sepolia: {
		chainId: 11155111,
		chainIdHex: '0xaa36a7',
		name: 'Sepolia',
		nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
		rpcUrls: ['https://sepolia.infura.io/v3/${INFURA_KEY}', 'https://rpc.sepolia.org'],
		blockExplorerUrls: ['https://sepolia.etherscan.io'],
	},
}
