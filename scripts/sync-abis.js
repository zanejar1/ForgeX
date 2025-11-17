const fs = require('fs');
const path = require('path');

function copyAbi(contractPath, outPath) {
  const artifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const data = { abi: artifact.abi, bytecode: artifact.bytecode };
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log(`Synced ${path.basename(outPath)} from ${path.basename(contractPath)}`);
}

function main() {
  const root = path.resolve(__dirname, '..');
  const artifactsRoot = path.join(root, 'Smart-contracts', 'artifacts', 'contracts');
  const frontendAbis = path.join(root, 'frontend', 'src', 'abis');

  const erc20Artifact = path.join(artifactsRoot, 'FactoryERC20.sol', 'ERC20Token.json');
  const erc721Artifact = path.join(artifactsRoot, 'FactoryERC721.sol', 'ERC721NFT.json');

  const erc20Out = path.join(frontendAbis, 'ERC20Token.json');
  const erc721Out = path.join(frontendAbis, 'ERC721NFT.json');

  if (!fs.existsSync(erc20Artifact)) throw new Error(`Missing artifact: ${erc20Artifact}`);
  if (!fs.existsSync(erc721Artifact)) throw new Error(`Missing artifact: ${erc721Artifact}`);

  copyAbi(erc20Artifact, erc20Out);
  copyAbi(erc721Artifact, erc721Out);
}

main();
