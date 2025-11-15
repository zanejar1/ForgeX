// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Minimal ERC-20 implementation used as a deployable template.
contract ERC20Token is ERC20, Ownable (msg.sender) {
    uint8 private _decimalsOverride;

    /// @param name_ Token name
    /// @param symbol_ Token symbol
    /// @param decimals_ Token decimals
    /// @param initialSupply_ Initial supply (in whole units, will be scaled by decimals)
    /// @param owner_ Owner/recipient of the initial supply
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply_,
        address owner_
    ) ERC20(name_, symbol_) {
        _decimalsOverride = decimals_;
        if (initialSupply_ > 0) {
            _mint(owner_, initialSupply_ * (10 ** uint256(decimals_)));
        }
        _transferOwnership(owner_);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimalsOverride;
    }
}

/// @title Factory for ERC-20 tokens
/// @notice Deploys minimal ERC-20 tokens and tracks user deployments.
contract FactoryERC20 {
    mapping(address => address[]) private _tokensByUser;

    /// @notice Emitted when a new token is deployed
    /// @param token Address of the deployed token
    /// @param creator Address that requested the deployment
    event TokenDeployed(address indexed token, address indexed creator);

    /// @notice Deploy a new ERC-20 token
    /// @param name Token name
    /// @param symbol Token symbol
    /// @param decimals_ Token decimals (uint8)
    /// @param initialSupply Initial supply in whole units (will be scaled by decimals)
    /// @return tokenAddr Address of the deployed token
    function createToken(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) external returns (address tokenAddr) {
        ERC20Token token = new ERC20Token(name, symbol, decimals_, initialSupply, msg.sender);
        tokenAddr = address(token);
        _tokensByUser[msg.sender].push(tokenAddr);
        emit TokenDeployed(tokenAddr, msg.sender);
    }

    /// @notice Returns the list of tokens deployed by a user
    /// @param user Address to query
    function getTokens(address user) external view returns (address[] memory) {
        return _tokensByUser[user];
    }
}

