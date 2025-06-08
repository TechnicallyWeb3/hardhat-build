/// !interface copyright Copyright (C) 2025 TechnicallyWeb3
/// !interface build ./interfaces/ITestRegistry.sol

// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
/// !interface import "@openzeppelin/contracts/access/IOwnable.sol"
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Test Registry Contract
/// @notice Simple test contract to verify the 'is' directive functionality
/// @dev Testing interface inheritance directive processing
contract TestRegistry is Ownable, ReentrancyGuard {
    /// !interface replace Ownable with IOwnable
    /// !interface is IDataStorage
    /// !interface is IEventEmitter
    /// !interface remove ReentrancyGuard

    /// @notice Registry of data entries
    mapping(address => string) public dataRegistry;
    
    /// @notice Total number of entries
    uint256 public totalEntries;

    /// @notice Emitted when data is registered
    /// @param user The user address
    /// @param data The data string
    event DataRegistered(address indexed user, string data);

    /// @notice Register data for the caller
    /// @param data The data to register
    function registerData(string calldata data) external {
        dataRegistry[msg.sender] = data;
        totalEntries++;
        emit DataRegistered(msg.sender, data);
    }

    /// @notice Get registered data for a user
    /// @param user The user address to query
    /// @return The registered data
    function getData(address user) external view returns (string memory) {
        return dataRegistry[user];
    }

    /// @notice Clear data for the caller
    function clearData() external {
        delete dataRegistry[msg.sender];
        totalEntries--;
    }
} 