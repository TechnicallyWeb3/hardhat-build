// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @custom:interface build ../interfaces/ITokenVault.sol
/// @custom:interface copyright "Copyright (c) 2024 TechnicallyWeb3. All rights reserved."
/// @custom:interface import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
/// @custom:interface import "@openzeppelin/contracts/access/IAccessControl.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Token Vault with Staking Rewards
/// @notice A vault that allows users to stake tokens and earn rewards
/// @dev Implements staking mechanics with time-based rewards and access control
/// @custom:version 1.0.0
contract TokenVault is ERC20, Ownable, ReentrancyGuard {
/// @custom:interface replace ERC20 with IERC20
/// @custom:interface replace Ownable with IAccessControl
/// @custom:interface remove ReentrancyGuard

    /// @notice The staking token accepted by this vault
    IERC20 public stakingToken;
    
    /// @notice Annual percentage yield for staking rewards (in basis points)
    uint256 public rewardRate; // 1000 = 10%
    
    /// @notice Minimum staking duration in seconds
    uint256 public minStakingDuration;
    
    /// @notice Total tokens currently staked in the vault
    uint256 public totalStaked;
    
    /// @notice Tracks if rewards are currently active
    bool public rewardsActive;

    /// @notice Information about a user's stake
    /// @param amount The amount of tokens staked
    /// @param timestamp When the stake was created
    /// @param lastRewardClaim When rewards were last claimed
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 lastRewardClaim;
    }

    /// @notice Mapping of user addresses to their stake information
    mapping(address => StakeInfo) public stakes;
    
    /// @notice Mapping of user addresses to their pending rewards
    mapping(address => uint256) public pendingRewards;

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

    /// @notice Debug event for internal calculations (excluded from interface)
    /// @param user The user address
    /// @param calculation The calculation result
    event DebugCalculation(address indexed user, uint256 calculation);
    /// @custom:interface exclude DebugCalculation

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

    /**
     * @notice Creates a new TokenVault
     * @dev Initializes the vault with specified parameters
     * @param _stakingToken The ERC20 token to be staked
     * @param _rewardRate The annual reward rate in basis points
     * @param _minStakingDuration Minimum time tokens must be staked
     * @param _name The name of the vault receipt token
     * @param _symbol The symbol of the vault receipt token
     */
    constructor(
        IERC20 _stakingToken,
        uint256 _rewardRate,
        uint256 _minStakingDuration,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        if (_rewardRate > 10000) { // Max 100% APY
            revert InvalidRewardRate(_rewardRate);
        }
        
        stakingToken = _stakingToken;
        rewardRate = _rewardRate;
        minStakingDuration = _minStakingDuration;
        rewardsActive = true;
    }

    /**
     * @notice Stakes tokens in the vault
     * @dev Transfers tokens from user and records stake information
     * @param amount The amount of tokens to stake
     * @custom:security Non-reentrant to prevent reentrancy attacks
     */
    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) {
            revert ZeroStakeAmount();
        }

        // Update pending rewards before modifying stake
        _updatePendingRewards(msg.sender);

        stakingToken.transferFrom(msg.sender, address(this), amount);
        
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].timestamp = block.timestamp;
        stakes[msg.sender].lastRewardClaim = block.timestamp;
        
        totalStaked += amount;
        
        // Mint receipt tokens
        _mint(msg.sender, amount);
        
        emit Staked(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Unstakes tokens from the vault
     * @dev Validates staking period and transfers tokens back to user
     * @param amount The amount of tokens to unstake
     * @custom:security Non-reentrant and validates minimum staking duration
     */
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        
        if (userStake.amount == 0) {
            revert NoActiveStake(msg.sender);
        }
        
        if (block.timestamp < userStake.timestamp + minStakingDuration) {
            uint256 timeRemaining = (userStake.timestamp + minStakingDuration) - block.timestamp;
            revert StakingPeriodNotMet(timeRemaining);
        }

        // Update pending rewards before modifying stake
        _updatePendingRewards(msg.sender);
        
        userStake.amount -= amount;
        totalStaked -= amount;
        
        // Burn receipt tokens
        _burn(msg.sender, amount);
        
        stakingToken.transfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Claims accumulated staking rewards
     * @dev Calculates and transfers reward tokens to the user
     * @return rewardAmount The amount of rewards claimed
     */
    function claimRewards() external nonReentrant returns (uint256 rewardAmount) {
        if (!rewardsActive) {
            revert RewardsNotActive();
        }
        
        _updatePendingRewards(msg.sender);
        
        rewardAmount = pendingRewards[msg.sender];
        if (rewardAmount > 0) {
            pendingRewards[msg.sender] = 0;
            stakes[msg.sender].lastRewardClaim = block.timestamp;
            
            // Mint reward tokens
            _mint(msg.sender, rewardAmount);
            
            emit RewardsClaimed(msg.sender, rewardAmount);
        }
        
        return rewardAmount;
    }

    /**
     * @notice Updates the reward rate (owner only)
     * @dev Changes the annual percentage yield for staking
     * @param newRate The new reward rate in basis points
     */
    function updateRewardRate(uint256 newRate) external onlyOwner {
        if (newRate > 10000) { // Max 100% APY
            revert InvalidRewardRate(newRate);
        }
        
        uint256 oldRate = rewardRate;
        rewardRate = newRate;
        
        emit RewardRateUpdated(oldRate, newRate);
    }

    /**
     * @notice Toggles the reward system on/off (owner only)
     * @dev Allows pausing/unpausing reward distribution
     * @param active Whether rewards should be active
     */
    function setRewardsActive(bool active) external onlyOwner {
        rewardsActive = active;
    }

    /**
     * @notice Calculates pending rewards for a user
     * @dev Public function to check rewards without claiming
     * @param user The user address to check
     * @return The amount of pending rewards
     */
    function calculatePendingRewards(address user) external view returns (uint256) {
        if (!rewardsActive) return 0;
        
        StakeInfo memory userStake = stakes[user];
        if (userStake.amount == 0) return 0;
        
        uint256 stakingDuration = block.timestamp - userStake.lastRewardClaim;
        uint256 annualReward = (userStake.amount * rewardRate) / 10000;
        uint256 reward = (annualReward * stakingDuration) / 365 days;
        
        return pendingRewards[user] + reward;
    }

    /**
     * @notice Returns comprehensive stake information for a user
     * @dev Combines stake data with calculated rewards
     * @param user The user address to query
     * @return amount The staked amount
     * @return stakeTime When the stake was created
     * @return pendingReward Current pending rewards
     * @return canUnstake Whether unstaking is currently allowed
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 stakeTime,
        uint256 pendingReward,
        bool canUnstake
    ) {
        StakeInfo memory userStake = stakes[user];
        amount = userStake.amount;
        stakeTime = userStake.timestamp;
        pendingReward = this.calculatePendingRewards(user);
        canUnstake = block.timestamp >= userStake.timestamp + minStakingDuration;
    }

    /// @notice Internal helper to calculate reward multiplier based on stake duration
    /// @param stakeDuration The duration of the stake in seconds
    /// @return multiplier The multiplier to apply to base rewards
    function _calculateRewardMultiplier(uint256 stakeDuration) internal pure returns (uint256 multiplier) {
        if (stakeDuration >= 365 days) return 150; // 1.5x for 1+ year stakes
        if (stakeDuration >= 90 days) return 125;  // 1.25x for 3+ month stakes  
        if (stakeDuration >= 30 days) return 110;  // 1.1x for 1+ month stakes
        return 100; // 1x for shorter stakes
    }
    /// @custom:interface include _calculateRewardMultiplier

    /// @notice Internal helper to update pending rewards for a user
    /// @param user The user address to update
    function _updatePendingRewards(address user) internal {
        if (!rewardsActive) return;
        
        StakeInfo storage userStake = stakes[user];
        if (userStake.amount == 0) return;
        
        uint256 stakingDuration = block.timestamp - userStake.lastRewardClaim;
        uint256 annualReward = (userStake.amount * rewardRate) / 10000;
        uint256 reward = (annualReward * stakingDuration) / 365 days;
        
        // Apply duration multiplier
        uint256 totalStakeDuration = block.timestamp - userStake.timestamp;
        uint256 multiplier = _calculateRewardMultiplier(totalStakeDuration);
        reward = (reward * multiplier) / 100;
        
        pendingRewards[user] += reward;
        
        // Debug event (excluded from interface)
        emit DebugCalculation(user, reward);
    }

    /// @notice Emergency withdrawal function (owner only, excluded from interface)
    /// @param token The token to withdraw
    /// @param amount The amount to withdraw
    function emergencyWithdraw(IERC20 token, uint256 amount) external onlyOwner {
        token.transfer(owner(), amount);
    }
    /// @custom:interface exclude emergencyWithdraw
} 