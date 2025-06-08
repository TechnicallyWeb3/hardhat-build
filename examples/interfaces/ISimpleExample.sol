// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Simple Example Contract
/// @notice A contract with no inheritance but uses is directive
interface ISimpleExample is ISomeContract, IAnotherInterface {

    /// @notice Simple storage value
    function value() external view returns (uint256);

    /// @notice Set the value
    /// @param newValue The new value to set
    function setValue(uint256 newValue) external;
    /// @notice Get the current value
    /// @return The current value
    function getValue() external view returns (uint256);
}
