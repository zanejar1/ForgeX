// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Minimal ERC-721 collection template used by the factory.
contract ERC721Collection is ERC721, Ownable (msg.sender) {
    string private _baseTokenURI;
    uint256 private _currentTokenId;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address owner_
    ) ERC721(name_, symbol_) {
        _baseTokenURI = baseURI_;
        _transferOwnership(owner_);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /// @notice Mint a new token to `to`. Only the collection owner can call.
    function mintTo(address to) external onlyOwner returns (uint256) {
        _currentTokenId += 1;
        _mint(to, _currentTokenId);
        return _currentTokenId;
    }
}

/// @title Factory for ERC-721 collections
/// @notice Deploys minimal ERC-721 collections and tracks user deployments.
contract FactoryERC721 {
    mapping(address => address[]) private _collectionsByUser;

    /// @notice Emitted when a new collection is deployed
    /// @param collection Address of the deployed collection
    /// @param creator Address that requested the deployment
    event CollectionDeployed(address indexed collection, address indexed creator);

    /// @notice Deploy a new ERC-721 collection
    /// @param name Collection name
    /// @param symbol Collection symbol
    /// @param baseURI Base URI for token metadata
    /// @return collectionAddr Address of the deployed collection
    function createCollection(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) external returns (address collectionAddr) {
        ERC721Collection collection = new ERC721Collection(name, symbol, baseURI, msg.sender);
        collectionAddr = address(collection);
        _collectionsByUser[msg.sender].push(collectionAddr);
        emit CollectionDeployed(collectionAddr, msg.sender);
    }

    /// @notice Returns the list of collections deployed by a user
    /// @param user Address to query
    function getCollections(address user) external view returns (address[] memory) {
        return _collectionsByUser[user];
    }
}