// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC721NFT is ERC721URIStorage, Ownable(msg.sender) {
    uint256 public tokenIdCounter;
    uint256 public maxSupply;
    string public collectionURI;

    event NFTMinted(address indexed minter, uint256 indexed tokenId);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory tokenURIInit,
        uint256 maxSupply_
    ) ERC721(name_, symbol_) {
        require(maxSupply_ > 0, "Max supply must be > 0");
        maxSupply = maxSupply_;
        collectionURI = tokenURIInit;
        // Mint the first token to the deployer with provided metadata URI
        uint256 newId = tokenIdCounter; // starts at 0
        tokenIdCounter = 1; // next token id
        _safeMint(msg.sender, newId);
        _setTokenURI(newId, collectionURI);
        emit NFTMinted(msg.sender, newId);
    }

    function mint() external returns (uint256) {
        require(tokenIdCounter < maxSupply, "Max supply reached");
        uint256 newId = tokenIdCounter;
        tokenIdCounter++;
        _safeMint(msg.sender, newId);
        _setTokenURI(newId, collectionURI);
        emit NFTMinted(msg.sender, newId);
        return newId;
    }

    function mintTo(address to) external onlyOwner returns (uint256) {
        require(tokenIdCounter < maxSupply, "Max supply reached");
        require(to != address(0), "Invalid recipient");
        uint256 newId = tokenIdCounter;
        tokenIdCounter++;
        _safeMint(to, newId);
        _setTokenURI(newId, collectionURI);
        emit NFTMinted(to, newId);
        return newId;
    }

    function nextTokenId() external view returns (uint256) {
        return tokenIdCounter;
    }
}
