// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// !interface module "@openzeppelin/contracts/access/Ownable.sol" to "./interfaces/IOwnable.sol" --remove Context
/// !interface build "./interfaces/IOwnershipTest.sol"
/// !interface replace Ownable with IOwnable

import "@openzeppelin/contracts/access/Ownable.sol";
/// !interface import "./IOwnable.sol"

/// @title Ownership Test Contract
/// @notice Test contract to verify module directive functionality
contract OwnershipTest is Ownable {
    uint256 public testValue;
    
    constructor(address _owner) Ownable(_owner) {
        testValue = 42;
    }
    
    /// @notice Sets a test value (only owner)
    /// @param _value The value to set
    function setTestValue(uint256 _value) external onlyOwner {
        testValue = _value;
    }
    
    /// @notice Demonstrates using the generated IOwnable interface
    /// @param _ownableContract Address of another Ownable contract
    /// @return The owner of the other contract
    function getOtherContractOwner(address _ownableContract) external view returns (address) {
        Ownable ownable = Ownable(_ownableContract);
        return ownable.owner();
    }

    function getOwnableContract(address _ownableContract) external view returns (Ownable) {
        return Ownable(_ownableContract);
    }
} 