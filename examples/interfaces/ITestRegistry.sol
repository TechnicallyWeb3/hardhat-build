// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/IOwnable.sol";

/// @title Test Registry Contract
/// @notice Simple test contract to verify the 'is' directive functionality
interface ITestRegistry is IOwnable, IDataStorage, IEventEmitter {

    /// @notice Emitted when data is registered
    /// @param user The user address
    /// @param data The data string
    event DataRegistered(address indexed user, string data);

    /// @notice Total number of entries
    function totalEntries() external view returns (uint256);

    /// @notice Register data for the caller
    /// @param data The data to register
    function registerData(string calldata data) external;
    /// @notice Get registered data for a user
    /// @param user The user address to query
    /// @return The registered data
    function getData(address user) external view returns (string memory);
    /// @notice Clear data for the caller
    function clearData() external;
}
