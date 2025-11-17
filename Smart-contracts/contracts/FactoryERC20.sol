// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Token is ERC20, Ownable(msg.sender) {
    uint256 public maxSupply;

    constructor(string memory name, string memory symbol, uint initialSupply, uint maxSupplyWhole)
        ERC20(name, symbol) {
        uint256 base = 10 ** uint256(decimals());
        uint256 initialBase = uint256(initialSupply) * base;
        uint256 maxBase = uint256(maxSupplyWhole) * base;
        require(maxBase > 0, "Max supply must be > 0");
        require(initialBase <= maxBase, "Initial exceeds max supply");
        maxSupply = maxBase;
        _mint(msg.sender, initialBase);
    }

    // Transfer tokens to a specified address without multiplying by decimals
    function transferTokens(address to, uint tokens) public returns (bool) {
        return transfer(to, tokens * 10 ** decimals());
    }

    // Mint new tokens to a specified address by the contract owner
    function mint(address to, uint amount) external onlyOwner {
        uint256 amountBase = uint256(amount) * (10 ** uint256(decimals()));
        require(totalSupply() + amountBase <= maxSupply, "Max supply reached");
        _mint(to, amountBase);
    }

    // Burn tokens from sender
    function burn(uint amount) external {
        _burn(msg.sender, amount * 10 ** decimals());
    }

}

