// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/IOwnable.sol";

/// @title Comma Test Example Contract
/// @notice Testing comma-separated interfaces in a single 'is' directive
interface ICommaTestExample is IOwnable, IDataStorage, IEventEmitter, IAccessControl {

    /// @notice Simple storage value
    function value() external view returns (uint256);

    /// @notice Set the value
    /// @param newValue The new value to set
    function setValue(uint256 newValue) external;
    /// @notice Get the current value
    /// @return The current value
    function getValue() external view returns (uint256);
}
