// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IDataPointStorage.sol";

/// @title DataPointStorage User Contract
/// @notice Simple contract to test IDataPointStorage interface usage
contract DataPointStorageUser {
    IDataPointStorage public immutable dataPointStorage;
    
    constructor(address _dataPointStorageAddress) {
        dataPointStorage = IDataPointStorage(_dataPointStorageAddress);
    }
    
    /// @notice Gets the version from the DataPointStorage contract
    /// @return The version number
    function getStorageVersion() external view returns (uint8) {
        return dataPointStorage.VERSION();
    }
    
    /// @notice Stores data and returns the calculated address
    /// @param _data The data to store
    /// @return The address where data was stored
    function storeData(bytes memory _data) external returns (bytes32) {
        return dataPointStorage.writeDataPoint(_data);
    }
    
    /// @notice Reads data from storage
    /// @param _dataPointAddress The address to read from
    /// @return The stored data
    function readData(bytes32 _dataPointAddress) external view returns (bytes memory) {
        return dataPointStorage.readDataPoint(_dataPointAddress);
    }
    
    /// @notice Gets the size of stored data
    /// @param _dataPointAddress The address to check
    /// @return The size of the data
    function getDataSize(bytes32 _dataPointAddress) external view returns (uint256) {
        return dataPointStorage.dataPointSize(_dataPointAddress);
    }
    
    /// @notice Calculates address for given data without storing
    /// @param _data The data to calculate address for
    /// @return The calculated address
    function previewAddress(bytes memory _data) external view returns (bytes32) {
        return dataPointStorage.calculateAddress(_data);
    }
} 