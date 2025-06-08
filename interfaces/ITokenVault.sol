// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Copyright (c) 2024 TechnicallyWeb3. All rights reserved.

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

/// @title Token Vault with Staking Rewards
/// @notice A vault that allows users to stake tokens and earn rewards
/// @dev Implements staking mechanics with time-based rewards and access control
interface ITokenVault is IERC20, IAccessControl {

    /// @notice Emitted when tokens are staked
    /// @param user The address that staked tokens
    /// @param amount The amount of tokens staked
    /// @param timestamp When the stake occurred
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    /// @notice Emitted when tokens are unstaked
    /// @param user The address that unstaked tokens
    /// @param amount The amount of tokens unstaked
    /// @param timestamp When the unstake occurred
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    /// @notice Emitted when rewards are claimed
    /// @param user The address that claimed rewards
    /// @param amount The amount of rewards claimed
    event RewardsClaimed(address indexed user, uint256 amount);
    /// @notice Emitted when reward rate is updated
    /// @param oldRate The previous reward rate
    /// @param newRate The new reward rate
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);

    /// @notice Thrown when trying to stake zero tokens
    error ZeroStakeAmount();
    /// @notice Thrown when trying to unstake before minimum duration
    /// @param timeRemaining Seconds remaining until unstake is allowed
    error StakingPeriodNotMet(uint256 timeRemaining);
    /// @notice Thrown when user has no active stake
    /// @param user The user address
    error NoActiveStake(address user);
    /// @notice Thrown when rewards are not currently active
    error RewardsNotActive();
    /// @notice Thrown when invalid reward rate is provided
    /// @param rate The invalid rate provided
    error InvalidRewardRate(uint256 rate);

    /// @notice Annual percentage yield for staking rewards (in basis points)
    function rewardRate() external view returns (uint256);
    /// @notice Minimum staking duration in seconds
    function minStakingDuration() external view returns (uint256);
    /// @notice Total tokens currently staked in the vault
    function totalStaked() external view returns (uint256);
    /// @notice Tracks if rewards are currently active
    function rewardsActive() external view returns (bool);

    /**
    * @notice Stakes tokens in the vault
    * @dev Transfers tokens from user and records stake information
    * @param amount The amount of tokens to stake
    * @custom:security Non-reentrant to prevent reentrancy attacks
    */
    function stake(uint256 amount) external;
    /**
    * @notice Unstakes tokens from the vault
    * @dev Validates staking period and transfers tokens back to user
    * @param amount The amount of tokens to unstake
    * @custom:security Non-reentrant and validates minimum staking duration
    */
    function unstake(uint256 amount) external;
    /**
    * @notice Claims accumulated staking rewards
    * @dev Calculates and transfers reward tokens to the user
    * @return rewardAmount The amount of rewards claimed
    */
    function claimRewards() external returns (uint256 rewardAmount);
    /**
    * @notice Updates the reward rate (owner only)
    * @dev Changes the annual percentage yield for staking
    * @param newRate The new reward rate in basis points
    */
    function updateRewardRate(uint256 newRate) external;
    /**
    * @notice Toggles the reward system on/off (owner only)
    * @dev Allows pausing/unpausing reward distribution
    * @param active Whether rewards should be active
    */
    function setRewardsActive(bool active) external;
    /**
    * @notice Calculates pending rewards for a user
    * @dev Public function to check rewards without claiming
    * @param user The user address to check
    * @return The amount of pending rewards
    */
    function calculatePendingRewards(address user) external view returns (uint256);
    /**
    * @notice Returns comprehensive stake information for a user
    * @dev Combines stake data with calculated rewards
    * @param user The user address to query
    * @return amount The staked amount
    * @return stakeTime When the stake was created
    * @return pendingReward Current pending rewards
    * @return canUnstake Whether unstaking is currently allowed
    */
    function getStakeInfo(address user) external view returns (uint256 amount, uint256 stakeTime, uint256 pendingReward, bool canUnstake);
    /// @notice Internal helper to calculate reward multiplier based on stake duration
    /// @param stakeDuration The duration of the stake in seconds
    /// @return multiplier The multiplier to apply to base rewards
    function _calculateRewardMultiplier(uint256 stakeDuration) external pure returns (uint256 multiplier);
}
