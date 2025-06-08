// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// !interface build ../interfaces/IComprehensiveExample.sol
/// !interface copyright "Copyright (c) 2024 TechnicallyWeb3. All rights reserved."
/// !interface import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
/// !interface import "@openzeppelin/contracts/access/IOwnable.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title Comprehensive Interface Example
/// @notice A feature-rich contract demonstrating all interface generation capabilities
/// @dev This contract showcases every type of interface directive and natspec documentation
/// @custom:version 2.1.0
/// @custom:experimental This contract is for demonstration purposes
contract ComprehensiveExample is ERC20, Ownable, ReentrancyGuard, Pausable {
/// !interface replace ERC20 with IERC20
/// !interface replace Ownable with IOwnable  
/// !interface remove ReentrancyGuard
/// !interface remove Pausable

    /// @notice The maximum supply of tokens that can ever exist
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18;
    
    /// @notice The current token price in wei
    uint256 public tokenPrice;
    
    /// @notice Fee percentage charged on transfers (in basis points)
    uint256 public transferFee; // 100 = 1%
    
    /// @notice The treasury address that receives fees
    address public treasury;
    
    /// @notice Total fees collected by the contract
    uint256 internal totalFeesCollected;
    /// !interface getter totalFeesCollected
    
    /// @notice Tracks if automatic fee collection is enabled
    bool private autoFeeCollection;
    /// !interface getter autoFeeCollection

    /// @notice Information about a user's staking position
    /// @param amount The amount of tokens staked
    /// @param timestamp When the stake was created
    /// @param rewardMultiplier Multiplier applied to rewards (basis points)
    struct StakingInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardMultiplier;
    }

    /// @notice Mapping of user addresses to their staking information
    mapping(address => StakingInfo) public stakingPositions;
    
    /// @notice Mapping of user addresses to their whitelisted status
    mapping(address => bool) public whitelist;
    
    /// @notice List of all stakers for enumeration
    address[] internal allStakers;

    /// @notice Emitted when tokens are purchased
    /// @param buyer The address that purchased tokens
    /// @param amount The amount of tokens purchased
    /// @param cost The total cost in wei
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost);

    /// @notice Emitted when tokens are staked
    /// @param user The address that staked tokens
    /// @param amount The amount of tokens staked
    /// @param multiplier The reward multiplier applied
    event TokensStaked(address indexed user, uint256 amount, uint256 multiplier);

    /// @notice Emitted when staking rewards are claimed
    /// @param user The address that claimed rewards
    /// @param amount The amount of rewards claimed
    event RewardsClaimed(address indexed user, uint256 amount);

    /// @notice Emitted when fees are collected
    /// @param collector The address that collected fees
    /// @param amount The amount of fees collected
    event FeesCollected(address indexed collector, uint256 amount);

    /// @notice Debug event for internal calculations (excluded from interface)
    /// @param user The user being calculated for
    /// @param calculation The calculation result
    /// @param gasUsed Gas used in the calculation
    event DebugCalculation(address indexed user, uint256 calculation, uint256 gasUsed);
    /// !interface exclude DebugCalculation

    /// @notice Emitted during development for testing (excluded from interface)
    /// @param message Debug message
    /// @param value Associated value
    event DevelopmentLog(string message, uint256 value);
    /// !interface exclude DevelopmentLog

    /// @notice Thrown when attempting to purchase zero tokens
    error ZeroPurchaseAmount();

    /// @notice Thrown when insufficient payment is provided
    /// @param required The required payment amount
    /// @param provided The amount actually provided
    error InsufficientPayment(uint256 required, uint256 provided);

    /// @notice Thrown when purchase would exceed maximum supply
    /// @param requested The requested amount
    /// @param available The available amount
    error ExceedsMaxSupply(uint256 requested, uint256 available);

    /// @notice Thrown when user is not whitelisted for an operation
    /// @param user The user address
    error NotWhitelisted(address user);

    /// @notice Thrown when staking amount is below minimum
    /// @param provided The provided amount
    /// @param minimum The minimum required amount
    error BelowMinimumStake(uint256 provided, uint256 minimum);

    /// @notice Thrown when trying to unstake non-existent position
    /// @param user The user address
    error NoStakingPosition(address user);

    /**
     * @notice Creates a new ComprehensiveExample token
     * @dev Initializes the contract with specified parameters and mints initial supply to deployer
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     * @param _initialPrice The initial price per token in wei
     * @param _treasury The treasury address for fee collection
     * @param _transferFee The initial transfer fee in basis points
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialPrice,
        address _treasury,
        uint256 _transferFee
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        require(_treasury != address(0), "Treasury cannot be zero address");
        require(_transferFee <= 1000, "Transfer fee cannot exceed 10%");
        
        tokenPrice = _initialPrice;
        treasury = _treasury;
        transferFee = _transferFee;
        autoFeeCollection = true;
        
        // Mint initial supply to deployer
        _mint(msg.sender, 100_000 * 10**decimals());
    }

    /**
     * @notice Purchase tokens by sending ETH
     * @dev Calculates token amount based on current price and mints to buyer
     * @param minTokens Minimum tokens expected (slippage protection)
     * @return tokensReceived The actual amount of tokens minted
     * @custom:security Non-reentrant to prevent reentrancy attacks
     */
    function purchaseTokens(uint256 minTokens) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        returns (uint256 tokensReceived) 
    {
        if (msg.value == 0) {
            revert ZeroPurchaseAmount();
        }

        tokensReceived = (msg.value * 10**decimals()) / tokenPrice;
        
        if (tokensReceived < minTokens) {
            revert InsufficientPayment(minTokens, tokensReceived);
        }
        
        if (totalSupply() + tokensReceived > MAX_SUPPLY) {
            revert ExceedsMaxSupply(tokensReceived, MAX_SUPPLY - totalSupply());
        }

        _mint(msg.sender, tokensReceived);
        emit TokensPurchased(msg.sender, tokensReceived, msg.value);
        
        return tokensReceived;
    }

    /**
     * @notice Stake tokens to earn rewards
     * @dev Transfers tokens to contract and records staking position
     * @param amount The amount of tokens to stake
     * @custom:security Requires non-zero amount and sufficient balance
     */
    function stakeTokens(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Cannot stake zero tokens");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        uint256 minimumStake = 100 * 10**decimals();
        if (amount < minimumStake) {
            revert BelowMinimumStake(amount, minimumStake);
        }

        // Calculate reward multiplier based on amount
        uint256 multiplier = _calculateStakingMultiplier(amount);
        
        // Record staking position
        stakingPositions[msg.sender] = StakingInfo({
            amount: amount,
            timestamp: block.timestamp,
            rewardMultiplier: multiplier
        });
        
        // Add to stakers list if first time
        if (stakingPositions[msg.sender].timestamp == block.timestamp) {
            allStakers.push(msg.sender);
        }
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        emit TokensStaked(msg.sender, amount, multiplier);
    }

    /**
     * @notice Claim staking rewards
     * @dev Calculates and mints reward tokens based on staking duration and multiplier
     * @return rewardAmount The amount of rewards claimed
     */
    function claimRewards() external nonReentrant returns (uint256 rewardAmount) {
        StakingInfo memory position = stakingPositions[msg.sender];
        
        if (position.amount == 0) {
            revert NoStakingPosition(msg.sender);
        }
        
        rewardAmount = _calculateRewards(msg.sender);
        
        if (rewardAmount > 0) {
            // Update last claim time
            stakingPositions[msg.sender].timestamp = block.timestamp;
            
            // Mint rewards
            _mint(msg.sender, rewardAmount);
            
            emit RewardsClaimed(msg.sender, rewardAmount);
        }
        
        return rewardAmount;
    }

    /**
     * @notice Unstake tokens and claim rewards
     * @dev Returns staked tokens plus any accumulated rewards
     * @param amount The amount of tokens to unstake (0 for all)
     * @return tokensReturned The amount of tokens returned
     * @return rewardsClaimed The amount of rewards claimed
     */
    function unstakeTokens(uint256 amount) 
        external 
        nonReentrant 
        returns (uint256 tokensReturned, uint256 rewardsClaimed) 
    {
        StakingInfo storage position = stakingPositions[msg.sender];
        
        if (position.amount == 0) {
            revert NoStakingPosition(msg.sender);
        }
        
        if (amount == 0) {
            amount = position.amount;
        }
        
        require(amount <= position.amount, "Insufficient staked amount");
        
        // Claim rewards first
        rewardsClaimed = _calculateRewards(msg.sender);
        if (rewardsClaimed > 0) {
            _mint(msg.sender, rewardsClaimed);
            emit RewardsClaimed(msg.sender, rewardsClaimed);
        }
        
        // Update position
        position.amount -= amount;
        position.timestamp = block.timestamp;
        
        // Return staked tokens
        _transfer(address(this), msg.sender, amount);
        tokensReturned = amount;
        
        return (tokensReturned, rewardsClaimed);
    }

    /**
     * @notice Update the token price (owner only)
     * @dev Changes the price for future token purchases
     * @param newPrice The new price per token in wei
     */
    function updateTokenPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be greater than zero");
        tokenPrice = newPrice;
    }

    /**
     * @notice Update transfer fee (owner only)
     * @dev Changes the fee percentage for transfers
     * @param newFee The new fee percentage in basis points
     */
    function updateTransferFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        transferFee = newFee;
    }

    /**
     * @notice Add addresses to whitelist (owner only)
     * @dev Whitelisted addresses can perform special operations
     * @param addresses Array of addresses to whitelist
     */
    function addToWhitelist(address[] calldata addresses) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            whitelist[addresses[i]] = true;
        }
    }

    /**
     * @notice Remove addresses from whitelist (owner only)
     * @dev Removes special privileges from addresses
     * @param addresses Array of addresses to remove from whitelist
     */
    function removeFromWhitelist(address[] calldata addresses) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            whitelist[addresses[i]] = false;
        }
    }

    /**
     * @notice Check if an address is whitelisted
     * @dev Public view function to check whitelist status
     * @param user The address to check
     * @return True if the address is whitelisted
     */
    function isWhitelisted(address user) external view returns (bool) {
        return whitelist[user];
    }

    /**
     * @notice Get staking information for a user
     * @dev Returns comprehensive staking data
     * @param user The user address to query
     * @return amount The staked amount
     * @return timestamp When the stake was created
     * @return multiplier The reward multiplier
     * @return pendingRewards Current pending rewards
     */
    function getStakingInfo(address user) 
        external 
        view 
        returns (
            uint256 amount,
            uint256 timestamp,
            uint256 multiplier,
            uint256 pendingRewards
        ) 
    {
        StakingInfo memory position = stakingPositions[user];
        amount = position.amount;
        timestamp = position.timestamp;
        multiplier = position.rewardMultiplier;
        pendingRewards = _calculateRewards(user);
    }

    /**
     * @notice Get the total number of stakers
     * @dev Returns the count of unique stakers
     * @return The total number of stakers
     */
    function getTotalStakers() external view returns (uint256) {
        return allStakers.length;
    }

    /**
     * @notice Collect accumulated fees (owner or whitelisted only)
     * @dev Transfers collected fees to treasury
     * @return feesCollected The amount of fees collected
     */
    function collectFees() external returns (uint256 feesCollected) {
        require(msg.sender == owner() || whitelist[msg.sender], "Not authorized");
        
        feesCollected = totalFeesCollected;
        if (feesCollected > 0) {
            totalFeesCollected = 0;
            payable(treasury).transfer(feesCollected);
            emit FeesCollected(msg.sender, feesCollected);
        }
        
        return feesCollected;
    }

    /// @notice Internal helper to calculate staking multiplier based on amount
    /// @param amount The staking amount
    /// @return multiplier The calculated multiplier in basis points
    function _calculateStakingMultiplier(uint256 amount) internal pure returns (uint256 multiplier) {
        if (amount >= 10_000 * 10**18) return 200; // 2x for large stakes
        if (amount >= 1_000 * 10**18) return 150;  // 1.5x for medium stakes
        if (amount >= 100 * 10**18) return 125;    // 1.25x for small stakes
        return 100; // 1x base multiplier
    }
    /// !interface include _calculateStakingMultiplier

    /// @notice Internal helper to calculate pending rewards for a user
    /// @param user The user address
    /// @return rewards The calculated pending rewards
    function _calculateRewards(address user) internal view returns (uint256 rewards) {
        StakingInfo memory position = stakingPositions[user];
        if (position.amount == 0) return 0;
        
        uint256 stakingDuration = block.timestamp - position.timestamp;
        uint256 baseReward = (position.amount * 100) / 10000; // 1% base annual rate
        uint256 annualReward = (baseReward * stakingDuration) / 365 days;
        
        // Apply multiplier
        rewards = (annualReward * position.multiplier) / 100;
        
        // Emit debug event (this will be excluded from interface)
        emit DebugCalculation(user, rewards, gasleft());
        
        return rewards;
    }

    /// @notice Emergency function to pause the contract (owner only, excluded from interface)
    /// @dev This function is for emergency use only and excluded from the interface
    function emergencyPause() external onlyOwner {
        _pause();
        emit DevelopmentLog("Contract paused", block.timestamp);
    }
    /// !interface exclude emergencyPause

    /// @notice Emergency function to unpause the contract (owner only, excluded from interface)
    /// @dev This function is for emergency use only and excluded from the interface
    function emergencyUnpause() external onlyOwner {
        _unpause();
        emit DevelopmentLog("Contract unpaused", block.timestamp);
    }
    /// !interface exclude emergencyUnpause

    /// @notice Emergency withdrawal function (owner only, excluded from interface)
    /// @param token The token contract to withdraw from
    /// @param amount The amount to withdraw
    function emergencyWithdraw(IERC20 token, uint256 amount) external onlyOwner {
        token.transfer(owner(), amount);
    }
    /// !interface exclude emergencyWithdraw

    /// @notice Override transfer to include fee mechanism
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0) && transferFee > 0) {
            uint256 fee = (value * transferFee) / 10000;
            if (fee > 0) {
                totalFeesCollected += fee;
                super._update(from, address(this), fee);
                value -= fee;
            }
        }
        
        super._update(from, to, value);
    }
} 