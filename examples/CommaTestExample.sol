/// !interface copyright Copyright (C) 2025 TechnicallyWeb3
/// !interface build ./interfaces/ICommaTestExample.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
/// !interface import "@openzeppelin/contracts/access/IOwnable.sol"

/// @title Comma Test Example Contract
/// @notice Testing comma-separated interfaces in a single 'is' directive
/// @dev Testing multiple interfaces in one directive line
contract CommaTestExample is Ownable {
    /// !interface replace Ownable with IOwnable
    /// !interface is IDataStorage, IEventEmitter, IAccessControl

    /// @notice Simple storage value
    uint256 public value;

    /// @notice Set the value
    /// @param newValue The new value to set
    function setValue(uint256 newValue) external onlyOwner {
        value = newValue;
    }

    /// @notice Get the current value
    /// @return The current value
    function getValue() external view returns (uint256) {
        return value;
    }
} 