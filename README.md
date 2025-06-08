# Build Interface Documentation

## Overview

**Hardhat Build** is a powerful Hardhat plugin that automatically generates Solidity interface files from contract implementations. It reads special interface directives embedded in contract comments and creates clean, well-documented interfaces with proper natspec documentation.

This plugin is designed for seamless integration with Hardhat projects but also works as a standalone CLI tool for any TypeScript/Node.js environment.

## Features

✅ **Automatic Interface Generation** - Converts contracts to interfaces with proper function signatures  
✅ **Natspec Documentation** - Copies and preserves both `///` and `/** */` style natspec comments  
✅ **Copyright Notice Support** - Adds copyright information to generated interfaces  
✅ **Selective Function Inclusion** - Control which functions, events, and errors are included  
✅ **Inheritance Processing** - Handles contract inheritance and interface replacement  
✅ **Getter Function Generation** - Creates getter functions for public variables  
✅ **Batch Processing** - Build all contracts at once with the "all" command  
✅ **Validation** - Ensures build directives are present before processing  

## Installation & Setup

### Hardhat Project Integration (Recommended)

If you're working in a Hardhat project, this is the easiest setup:

```bash
# Install as a dev dependency
npm install --save-dev hardhat-build

# Add to your hardhat.config.js or hardhat.config.ts
require('hardhat-build');
// or ES6: import 'hardhat-build';
```

**No additional setup required!** Hardhat projects typically include TypeScript and ts-node dependencies.

### Standalone Installation

For use outside of Hardhat projects or global installation:

```bash
# Global installation - works anywhere (includes Hardhat as dependency)
npm install -g hardhat-build

# Local installation
npm install hardhat-build

# TypeScript support (if not already available)
npm install --save-dev typescript ts-node
```

**Note**: `npx hardhat-build` works even outside Hardhat projects since we include Hardhat as a dependency!

## Quick Start

### Option 1: Hardhat Integration (Recommended)

```solidity
/// !interface build ../interfaces/IMyContract.sol
contract MyContract {
    function myFunction() external pure returns (uint256);
}
```

```bash
# Complete build pipeline (TypeScript + Hardhat + Interfaces)
npx hardhat build

# Interface generation only
npx hardhat build --interfaces

# Force regeneration
npx hardhat build --interfaces --force
```

### Option 2: Direct CLI Usage

```bash
# Using compiled JavaScript (works anywhere)
npx hardhat-build all

# Using TypeScript source (requires ts-node in your project)
npx ts-node node_modules/hardhat-build/src/buildInterface.ts all

# Force regeneration
npx hardhat-build all --force
```

### Option 3: In-Project Development

If you're working within the plugin's source code:

```bash
# Development with TypeScript source
npx ts-node src/buildInterface.ts contracts/MyContract.sol

# Production with compiled version  
node dist/buildInterface.js contracts/MyContract.sol
```

## Command Line Usage

### Hardhat Task Commands (Recommended)

```bash
# Complete build pipeline (TypeScript + Hardhat + Interfaces)
npx hardhat build

# Interface generation only
npx hardhat build --interfaces

# Force regeneration of all interfaces
npx hardhat build --interfaces --force
```

### CLI Binary Commands (Works Everywhere)

```bash
# Using the CLI binary (includes Hardhat as dependency)
npx hardhat-build                    # Complete build pipeline
npx hardhat-build --interfaces      # Interface generation only
npx hardhat-build --force           # Force rebuild all
npx hardhat-build --help            # Show all options
```

### Direct Script Commands

For development or when you need TypeScript source access:

```bash
# Using TypeScript source (requires ts-node in your project)
npx ts-node node_modules/hardhat-build/src/buildInterface.ts all
npx ts-node node_modules/hardhat-build/src/buildInterface.ts contracts/MyContract.sol --force

# Using compiled JavaScript
node node_modules/hardhat-build/dist/buildInterface.js all --force
```

### Batch Processing

All commands support batch processing with automatic contract discovery:

```bash
# These commands will:
# - Recursively search the './contracts' directory  
# - Find all .sol files with '/// !interface build' directives
# - Build interfaces for all discovered contracts
# - Report success/failure summary with file counts

npx hardhat build --interfaces
npx hardhat-build
npx ts-node node_modules/hardhat-build/src/buildInterface.ts all
```

## Interface Directives

Interface directives are special comments that control how the interface is generated. All directives start with `/// !interface`.

### Required Directives

#### `build`
**Required.** Specifies the output path for the generated interface.

```solidity
/// !interface build ./interfaces/IMyContract.sol
```

### Optional Directives

#### `copyright`
Adds a copyright notice to the generated interface.

```solidity
/// !interface copyright "Copyright (c) 2024 MyCompany. All rights reserved."
```

#### `import`
Adds import statements to the generated interface.

```solidity
/// !interface import "@openzeppelin/contracts/access/IOwnable.sol";
/// !interface import "./ICustomInterface.sol";
```

#### `replace`
Replaces inheritance contracts with interface equivalents.

```solidity
contract MyContract is Ownable {
/// !interface replace Ownable with IOwnable
```

#### `remove`
Removes inheritance contracts from the interface.

```solidity
contract MyContract is Ownable, ReentrancyGuard {
/// !interface remove ReentrancyGuard
```

#### `is`
Adds additional interface inheritance that wasn't in the original contract.

```solidity
contract MyContract is Ownable {
/// !interface is IDataStorage
/// !interface is IEventEmitter
// OR use comma-separated in single line:
/// !interface is IDataStorage, IEventEmitter
// Results in: interface IMyContract is IOwnable, IDataStorage, IEventEmitter
```

#### `exclude`
Excludes specific functions, events, or errors from the interface.

```solidity
function internalFunction() public {
    // implementation
}
/// !interface exclude internalFunction

event DebugEvent(string message);
/// !interface exclude DebugEvent
```

#### `include`
Forces inclusion of internal/private functions in the interface.

```solidity
function _internalHelper() internal view returns (uint256) {
    return someValue;
}
/// !interface include _internalHelper
```

#### `getter`
Generates getter functions for variables (automatic for public variables).

```solidity
uint256 internal myValue;
/// !interface getter myValue
```

## Natspec Documentation Support

The script preserves natspec documentation from the original contract:

### Single-line Style (`///`)
```solidity
/// @notice Transfer tokens between accounts
/// @param to The recipient address
/// @param amount The amount to transfer
/// @return success Whether the transfer succeeded
function transfer(address to, uint256 amount) external returns (bool success);
```

### Block Style (`/** */`)
```solidity
/**
 * @notice Approve spending allowance
 * @dev Sets the allowance for a spender
 * @param spender The address to approve
 * @param amount The allowance amount
 * @return success Whether approval succeeded
 */
function approve(address spender, uint256 amount) external returns (bool success);
```

## Complete Example

### Input Contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// !interface build ./interfaces/IExampleToken.sol
/// !interface copyright "Copyright (c) 2024 MyCompany. All rights reserved."

import "@openzeppelin/contracts/access/Ownable.sol";
/// !interface import "@openzeppelin/contracts/access/IOwnable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Example Token Contract
/// @notice A simple ERC20-like token implementation
/// @dev Demonstrates the build interface system
contract ExampleToken is Ownable, ReentrancyGuard {
/// !interface replace Ownable with IOwnable
/// !interface remove ReentrancyGuard

    /// @notice The total supply of tokens
    uint256 public totalSupply;
    
    /// @notice Mapping of account balances
    mapping(address => uint256) public balances;
    
    /// @notice Emitted when tokens are transferred
    /// @param from The sender address
    /// @param to The recipient address
    /// @param value The amount transferred
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    /// @notice Debug event (excluded from interface)
    event DebugEvent(string message);
    /// !interface exclude DebugEvent
    
    /// @notice Thrown when insufficient balance
    /// @param requested The requested amount
    /// @param available The available amount
    error InsufficientBalance(uint256 requested, uint256 available);
    
    /**
     * @notice Transfer tokens to another account
     * @dev Validates balances and emits Transfer event
     * @param to The recipient address
     * @param amount The amount to transfer
     * @return success Whether the transfer succeeded
     */
    function transfer(address to, uint256 amount) external returns (bool success) {
        if (balances[msg.sender] < amount) {
            revert InsufficientBalance(amount, balances[msg.sender]);
        }
        
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    /// @notice Internal helper function (forced to include)
    function _calculateFee(uint256 amount) internal pure returns (uint256) {
        return amount / 100;
    }
    /// !interface include _calculateFee
}
```

### Generated Interface
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Copyright (c) 2024 MyCompany. All rights reserved.

import "@openzeppelin/contracts/access/IOwnable.sol";

/// @title Example Token Contract
/// @notice A simple ERC20-like token implementation
/// @dev Demonstrates the build interface system
interface IExampleToken is IOwnable {

    /// @notice Emitted when tokens are transferred
    /// @param from The sender address
    /// @param to The recipient address
    /// @param value The amount transferred
    event Transfer(address indexed from, address indexed to, uint256 value);

    /// @notice Thrown when insufficient balance
    /// @param requested The requested amount
    /// @param available The available amount
    error InsufficientBalance(uint256 requested, uint256 available);

    /// @notice The total supply of tokens
    function totalSupply() external view returns (uint256);
    /// @notice Mapping of account balances
    function balances(address account) external view returns (uint256);

    /**
     * @notice Transfer tokens to another account
     * @dev Validates balances and emits Transfer event
     * @param to The recipient address
     * @param amount The amount to transfer
     * @return success Whether the transfer succeeded
     */
    function transfer(address to, uint256 amount) external returns (bool success);
    /// @notice Internal helper function (forced to include)
    function _calculateFee(uint256 amount) external pure returns (uint256);
}
```

## Function Inclusion Rules

By default, the script includes:
- ✅ `external` functions
- ✅ `public` functions (converted to `external` in interface)
- ✅ Public state variables (as getter functions)
- ✅ All events (unless explicitly excluded)
- ✅ All custom errors (unless explicitly excluded)

By default, the script excludes:
- ❌ `internal` functions (unless explicitly included)
- ❌ `private` functions (unless explicitly included)
- ❌ Constructor functions
- ❌ Modifier definitions

## Error Handling

### Missing Build Directive
```bash
Error: No build directive found. Use /// !interface build <path>
```
**Solution:** Add `/// !interface build <output-path>` to your contract.

### Invalid Solidity Syntax
```bash
Error: Contract declaration not found
```
**Solution:** Ensure your contract has valid Solidity syntax and proper contract declaration.

### File Permission Issues
```bash
Error: EACCES: permission denied
```
**Solution:** Check file permissions and ensure the output directory is writable.

## Best Practices

### 1. Organize Interface Directives
Place all interface directives near the top of your contract:

```solidity
/// !interface build ./interfaces/IMyContract.sol
/// !interface copyright "Copyright (c) 2024 Company Name. All rights reserved."
/// !interface import "@openzeppelin/contracts/access/IOwnable.sol";

contract MyContract is Ownable {
/// !interface replace Ownable with IOwnable
    // Contract implementation
}
```

### 2. Use Descriptive Natspec
Write comprehensive documentation that will be copied to interfaces:

```solidity
/**
 * @notice Performs a complex operation
 * @dev This function handles multiple edge cases
 * @param input The input parameter with specific constraints
 * @return result The computed result
 * @custom:security This function requires special access control
 */
function complexOperation(uint256 input) external returns (uint256 result);
```

### 3. Consistent Interface Naming
Use the `I` prefix for interface names and mirror the contract structure:

```
contracts/
  ├── tokens/
  │   └── MyToken.sol          → interfaces/tokens/IMyToken.sol
  └── governance/
      └── MyGovernance.sol     → interfaces/governance/IMyGovernance.sol
```

### 4. Group Related Directives
Keep related directives together and add comments for clarity:

```solidity
// Interface configuration
/// !interface build ./interfaces/IComplexContract.sol
/// !interface copyright "Copyright (c) 2024 MyCompany. All rights reserved."

// Import dependencies
/// !interface import "@openzeppelin/contracts/access/IOwnable.sol";
/// !interface import "./ICustomInterface.sol";

// Inheritance modifications
/// !interface replace Ownable with IOwnable
/// !interface remove ReentrancyGuard
```

### 5. Batch Processing in CI/CD
Add interface generation to your build pipeline:

```yaml
# .github/workflows/build.yml
- name: Generate Interfaces
  run: npx ts-node src/buildInterface.ts all
  
- name: Check for changes
  run: git diff --exit-code interfaces/
```

## Troubleshooting

### Common Issues

**Q: The script doesn't find my contract**  
A: Ensure your contract file contains `/// !interface build` directive and is in the `./contracts` directory.

**Q: Natspec comments are missing from the interface**  
A: Check that natspec comments are placed directly above the function/event/error definition without blank lines.

**Q: Interface inheritance is incorrect**  
A: Use `replace` and `remove` directives to properly map contract inheritance to interface inheritance.

**Q: Private functions appear in the interface**  
A: Remove any `include` directives for private functions, or make them internal/public if they should be in the interface.

**Q: Build fails with parsing errors**  
A: Ensure your Solidity contract compiles successfully before running the interface generator.

## Advanced Usage

### Custom Directory Processing
Modify the script to process contracts from different directories:

```typescript
const contractFiles = await findContractsWithBuildDirectives('./src/contracts');
```

### Integration with Hardhat Tasks
Create a Hardhat task for interface generation:

```javascript
// hardhat.config.js
task("build-interfaces", "Generate all contract interfaces")
  .setAction(async (taskArgs, hre) => {
    const { buildAllInterfaces } = require("hardhat-build");
    await buildAllInterfaces();
  });
```

### Programmatic Usage
Use the script programmatically in other tools:

```typescript
import { buildInterface, findContractsWithBuildDirectives } from 'hardhat-build';

// Build single contract
await buildInterface('./contracts/MyContract.sol');

// Find all contracts with directives
const contracts = await findContractsWithBuildDirectives('./contracts');

// Build specific contracts
for (const contract of contracts) {
  await buildInterface(contract);
}
```

## Contributing

When adding new features to the build interface script:

1. Update the interface directive parsing logic
2. Add comprehensive tests
3. Update this documentation
4. Ensure backward compatibility
5. Add examples demonstrating the new feature

## License

This build interface tool is part of the project and follows the same license terms.

## Usage Summary

### Primary Usage (Hardhat Integration)

```bash
# Recommended: Use Hardhat build task for development
npx hardhat build --interfaces --force
npx hardhat build

# Alternative: Use CLI binary anywhere (includes Hardhat)
npx hardhat-build --force
```

### Development Usage (TypeScript Source)

```bash
# When you need access to TypeScript source (dev/debugging)
npx ts-node node_modules/hardhat-build/src/buildInterface.ts all --force

# In-project development (if working on the plugin itself)
npx ts-node src/buildInterface.ts contracts/MyContract.sol --force
```

### Production Usage (Compiled JavaScript)

```bash
# Standalone CLI binary (works anywhere - includes Hardhat dependency)
npx hardhat-build --interfaces --force

# Direct compiled script usage
node node_modules/hardhat-build/dist/buildInterface.js all --force
```

## Performance Optimization

The interface generator automatically skips files that are already up-to-date by comparing timestamps between the source contract and generated interface files. This significantly speeds up builds when only a few contracts have changed.

### Force Regeneration

Use the `--force` flag to bypass timestamp checks and regenerate all interface files:

- **When to use**: After changing interface directives, updating the tool version, or when you need to ensure all files are regenerated
- **Performance**: Slower but ensures all files are current
- **Default behavior**: Only regenerates files when the source contract is newer than the interface file

```bash
# Skip up-to-date files (default, faster)
npx ts-node src/buildInterface.ts all

# Force regeneration of all files (slower, comprehensive)
npx ts-node src/buildInterface.ts all --force
```

The tool will show clear messages indicating which files were skipped vs. regenerated:
- `⏭️ Skipping file.sol (up to date, use --force to regenerate)`
- `Interface generated: file.sol` 