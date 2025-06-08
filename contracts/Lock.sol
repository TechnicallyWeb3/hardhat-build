// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// !interface build ../interfaces/ILock.sol
/// !interface copyright "Copyright (c) 2024 TechnicallyWeb3. All rights reserved."

// Uncomment this line to use console.log
// import "hardhat/console.sol";

/// @title Time-locked withdrawal contract
/// @notice A contract that locks funds until a specified unlock time
/// @dev Demonstrates time-based access control and withdrawal patterns
contract Lock {
    /// @notice The timestamp when funds can be withdrawn
    uint public unlockTime;
    
    /// @notice The owner of the locked funds
    address payable public owner;

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
     * @notice Creates a new time-locked contract
     * @dev The unlock time must be in the future
     * @param _unlockTime The timestamp when funds can be withdrawn
     */
    constructor(uint _unlockTime) payable {
        require(
            block.timestamp < _unlockTime,
            "Unlock time should be in the future"
        );

        unlockTime = _unlockTime;
        owner = payable(msg.sender);
    }

    /**
     * @notice Withdraws all locked funds to the owner
     * @dev Can only be called by the owner after the unlock time
     * @custom:security Requires time-based and ownership validation
     */
    function withdraw() public {
        // Uncomment this line, and the import of "hardhat/console.sol", to print a log in your terminal
        // console.log("Unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);

        if (block.timestamp < unlockTime) {
            revert WithdrawalTooEarly(block.timestamp, unlockTime);
        }
        
        if (msg.sender != owner) {
            revert UnauthorizedWithdrawal(msg.sender, owner);
        }

        emit Withdrawal(address(this).balance, block.timestamp);

        owner.transfer(address(this).balance);
    }

    /// @notice Returns the current balance of the contract
    /// @return The contract's ETH balance in wei
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Checks if the contract is ready for withdrawal
    /// @return True if current time >= unlock time
    function isUnlocked() external view returns (bool) {
        return block.timestamp >= unlockTime;
    }
}
