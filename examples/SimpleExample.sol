/// !interface copyright Copyright (C) 2025 TechnicallyWeb3
/// !interface build ./interfaces/ISimpleExample.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Simple Example Contract
/// @notice A contract with no inheritance but uses is directive
/// @dev Testing 'is' directive with no original inheritance
contract SimpleExample {
    /// !interface is ISomeContract
    /// !interface is IAnotherInterface

    /// @notice Simple storage value
    uint256 public value;

    /// @notice Set the value
    /// @param newValue The new value to set
    function setValue(uint256 newValue) external {
        value = newValue;
    }

    /// @notice Get the current value
    /// @return The current value
    function getValue() external view returns (uint256) {
        return value;
    }
} 