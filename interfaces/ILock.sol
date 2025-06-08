// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Copyright (c) 2024 TechnicallyWeb3. All rights reserved.

/// @title Time-locked withdrawal contract
/// @notice A contract that locks funds until a specified unlock time
interface ILock {

    /// @notice Emitted when funds are withdrawn
    /// @param amount The amount withdrawn
    /// @param when The timestamp of withdrawal
    event Withdrawal(uint amount, uint when);

    /// @notice Thrown when attempting to withdraw before unlock time
    /// @param current Current block timestamp
    /// @param required Required unlock timestamp
    error WithdrawalTooEarly(uint256 current, uint256 required);
    /// @notice Thrown when non-owner attempts to withdraw
    /// @param caller The address that attempted to withdraw
    /// @param owner The actual owner address
    error UnauthorizedWithdrawal(address caller, address owner);

    /**
    * @notice Withdraws all locked funds to the owner
    * @dev Can only be called by the owner after the unlock time
    * @custom:security Requires time-based and ownership validation
    */
    function withdraw() external;
    /// @notice Returns the current balance of the contract
    /// @return The contract's ETH balance in wei
    function getBalance() external view returns (uint256);
    /// @notice Checks if the contract is ready for withdrawal
    /// @return True if current time >= unlock time
    function isUnlocked() external view returns (bool);
}
