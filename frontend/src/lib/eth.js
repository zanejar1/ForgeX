import { BrowserProvider, ContractFactory } from 'ethers'
import erc20Artifact from '../abis/ERC20Token.json'
import erc721Artifact from '../abis/ERC721NFT.json'
import { CHAINS } from '../config/contracts.js'

function selectMetaMask() {
  if (typeof window === 'undefined') return null
  const eth = window.ethereum
  if (!eth) return null
  if (Array.isArray(eth.providers)) {
    const mm = eth.providers.find(p => p && p.isMetaMask)
    if (mm) return mm
  }
  if (eth.isMetaMask) return eth
  return null
}

export function getBrowserProvider() {
  const mm = selectMetaMask()
  if (!mm) return null
  return new BrowserProvider(mm)
}

export async function getSigner() {
  const provider = getBrowserProvider()
  if (!provider) return null
  try {
    return await provider.getSigner()
  } catch {
    return null
  }
}

// Factory contract helpers removed (direct deployment only now).

export async function getChainId(provider) {
  try {
    return Number((await provider?.send('eth_chainId', [])) || 0)
  } catch {
    try {
      const net = await provider?.getNetwork()
      return Number(net?.chainId || 0)
    } catch {
      return 0
    }
  }
}

export async function ensureSepoliaNetwork() {
  const mm = selectMetaMask()
  if (!mm) return false
  const target = CHAINS.sepolia
  try {
    await mm.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: target.chainIdHex }],
    })
    return true
  } catch (err) {
    if (err?.code === 4902) {
      try {
        await mm.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: target.chainIdHex,
              chainName: target.name,
              nativeCurrency: target.nativeCurrency,
              rpcUrls: target.rpcUrls,
              blockExplorerUrls: target.blockExplorerUrls,
            },
          ],
        })
        return true
      } catch {
        return false
      }
    }
    return false
  }
}

/**
 * Deploy a fresh ERC20Token contract directly from the connected wallet.
 * Returns { address, txHash, contract } on success.
 */
export async function deployERC20Token({ signer, name, symbol, initialSupply, maxSupply }) {
  if (!signer) throw new Error('Missing signer')
  const hasAbi = Array.isArray(erc20Artifact?.abi) && erc20Artifact.abi.length > 0
  const hasBytecode = typeof erc20Artifact?.bytecode === 'string' && erc20Artifact.bytecode.startsWith('0x')
  if (!hasAbi || !hasBytecode) {
    throw new Error(`Invalid ERC20 artifact (abi:${hasAbi?'ok':'missing'} bytecode:${hasBytecode?'ok':'missing/bad'})`)
  }

  const factory = new ContractFactory(erc20Artifact.abi, erc20Artifact.bytecode, signer)

  // Optional preflight gas estimation to catch obvious failures early
  try {
    const txReq = await factory.getDeployTransaction(name, symbol, initialSupply, maxSupply)
    const provider = signer.provider
    if (provider?.estimateGas) {
      await provider.estimateGas(txReq)
    }
  } catch (err) {
    // Allow proceeding; the actual deploy might still surface clearer errors
  }
  let contract
  try {
    contract = await factory.deploy(name, symbol, initialSupply, maxSupply)
  } catch (e) {
    const detail = e?.message || String(e)
    throw new Error(`Deploy failed: ${detail}`)
  }
  const deployTx = contract.deploymentTransaction?.() || null
  const txHash = deployTx?.hash || null
  await contract.waitForDeployment()
  const address = await contract.getAddress()
  return { address, txHash, contract }
}

export async function deployERC721NFT({ signer, name, symbol, tokenURI, maxSupply }) {
  if (!signer) throw new Error('Missing signer')
  const hasAbi = Array.isArray(erc721Artifact?.abi) && erc721Artifact.abi.length > 0
  const hasBytecode = typeof erc721Artifact?.bytecode === 'string' && erc721Artifact.bytecode.startsWith('0x')
  if (!hasAbi || !hasBytecode) {
    throw new Error(`Invalid ERC721 artifact (abi:${hasAbi?'ok':'missing'} bytecode:${hasBytecode?'ok':'missing/bad'})`)
  }
  const factory = new ContractFactory(erc721Artifact.abi, erc721Artifact.bytecode, signer)
  let gasEstimate
  try {
    gasEstimate = await factory.deploy.estimateGas(name, symbol, tokenURI, maxSupply)
  } catch (e) {
    // proceed, gas estimation might fail on some providers
  }
  try {
    const overrides = gasEstimate ? { gasLimit: gasEstimate + (gasEstimate / 5n) } : {}
    const contract = await factory.deploy(name, symbol, tokenURI, maxSupply, overrides)
    const tx = contract.deploymentTransaction?.()
    const receipt = tx ? await tx.wait() : null
    return { address: contract.target, txHash: receipt?.hash }
  } catch (e) {
    throw new Error('Deploy failed: ' + (e?.shortMessage || e?.message || ''))
  }
}
