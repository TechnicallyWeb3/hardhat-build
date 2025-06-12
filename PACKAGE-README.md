# hardhat-build

[![npm version](https://badge.fury.io/js/hardhat-build.svg)](https://badge.fury.io/js/hardhat-build)

A powerful Hardhat plugin that automatically generates Solidity interface files from contract implementations with proper natspec documentation and intelligent directive-based configuration.

## Features

✅ **Automatic Interface Generation** - Converts contracts to interfaces with proper function signatures  
✅ **Natspec Documentation** - Copies and preserves both `///` and `/** */` style natspec comments  
✅ **Copyright Notice Support** - Adds copyright information to generated interfaces  
✅ **Selective Function Inclusion** - Control which functions, events, and errors are included  
✅ **Inheritance Processing** - Handles contract inheritance and interface replacement  
✅ **Getter Function Generation** - Creates getter functions for public variables  
✅ **Batch Processing** - Build all contracts at once  
✅ **Hardhat Integration** - Built-in Hardhat tasks for seamless workflow  

## Installation & Setup

### Hardhat Project Integration

```bash
# Install as a dev dependency
npm install --save-dev hardhat-build

# Add to your hardhat.config.js or hardhat.config.ts
require('hardhat-build');
// or ES6: import 'hardhat-build';
```

**No additional setup required!** Hardhat projects typically include TypeScript and ts-node dependencies.

### Standalone Installation

```bash
# Global installation - works anywhere (includes Hardhat as dependency)
npm install -g hardhat-build

# TypeScript support (if not already available)
npm install --save-dev typescript ts-node
```

**Note**: `npx hardhat-build` works even outside Hardhat projects since we include Hardhat as a dependency!

## Usage

### Hardhat Integration (Recommended)

```bash
# Build all contracts with directives
npx hardhat build --interfaces

# Force regeneration of all interfaces
npx hardhat build --interfaces --force

# Complete build pipeline
npx hardhat build
```

### CLI Binary Commands (Works Everywhere)

```bash
# Using the CLI binary (includes Hardhat as dependency)
npx hardhat-build                    # Complete build pipeline
npx hardhat-build --interfaces      # Interface generation only
npx hardhat-build --force           # Force rebuild all
```

### TypeScript Source Access

```bash
# When you need TypeScript source access (development/debugging)
npx ts-node node_modules/hardhat-build/src/buildInterface.ts all --force

# Direct compiled usage
node node_modules/hardhat-build/dist/buildInterface.js all --force
```

### Performance

The tool automatically skips up-to-date interface files by comparing timestamps. Use `--force` to regenerate all files regardless of timestamps.

## Quick Start

### 1. Add Interface Directives to Your Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @custom:interface build ../interfaces/IMyContract.sol
/// @custom:interface copyright "Copyright (c) 2024 MyCompany. All rights reserved."

/// @title My Contract
/// @notice A sample contract demonstrating the interface builder
contract MyContract {
    /// @notice The contract owner
    address public owner;
    
    /// @notice Emitted when ownership is transferred
    /// @param previousOwner The previous owner
    /// @param newOwner The new owner
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    /**
     * @notice Transfer ownership to a new address
     * @param newOwner The address to transfer ownership to
     */
    function transferOwnership(address newOwner) external {
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }
}
```

### 2. Generate the Interface

#### Single Contract:
```bash
npx hardhat build-interface --contract MyContract.sol
# or
npx hardhat build-interface --contract contracts/MyContract.sol
```

#### All Contracts:
```bash
npx hardhat build-interface --all
```

### 3. Generated Interface

The plugin will create `interfaces/IMyContract.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Copyright (c) 2024 MyCompany. All rights reserved.

/// @title My Contract
/// @notice A sample contract demonstrating the interface builder
interface IMyContract {

    /// @notice Emitted when ownership is transferred
    /// @param previousOwner The previous owner
    /// @param newOwner The new owner
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @notice The contract owner
    function owner() external view returns (address);
    
    /**
     * @notice Transfer ownership to a new address
     * @param newOwner The address to transfer ownership to
     */
    function transferOwnership(address newOwner) external;
}
```

## Best Practices

### 📁 Recommended Directory Structure

We recommend using the `interfaces/` directory pattern with the `I{ContractName}.sol` naming convention:

```
project/
├── contracts/
│   ├── Token.sol                    // Contract implementations
│   ├── Staking.sol
│   └── Registry.sol
├── interfaces/                      // Generated interfaces (add to .gitignore)
│   ├── IToken.sol
│   ├── IStaking.sol
│   └── IRegistry.sol
└── .gitignore
```

### 🔧 Interface Directive Pattern

Use this pattern in your contracts:

```solidity
/// @custom:interface build ./interfaces/I{ContractName}.sol
contract MyContract {
    // implementation
}
```

Examples:
```solidity
/// @custom:interface build ./interfaces/IToken.sol
contract Token { }

/// @custom:interface build ../interfaces/IStaking.sol  // from subdirectory
contract Staking { }
```

### 📝 Git Ignore Configuration

**Important**: Add generated interfaces to your `.gitignore` since they are build artifacts:

```gitignore
# Build artifacts
artifacts/
cache/
typechain-types/

# Generated interfaces (hardhat-build)
**/interfaces/
```

This prevents generated interface files from being committed to your repository, keeping it clean and avoiding merge conflicts.

### 🎯 Why This Pattern?

- **Consistent**: Standard `I{ContractName}` naming follows Solidity conventions
- **Organized**: Dedicated `interfaces/` directory keeps generated files separate
- **Clean Repos**: Adding to `.gitignore` prevents committing build artifacts
- **Team Friendly**: Everyone generates the same interfaces locally

## Interface Directives

Control interface generation with special comments in your contracts:

### Required Directives

#### `build` - Specify Output Path
```solidity
/// @custom:interface build ../interfaces/IMyContract.sol
```

### Optional Directives

#### `copyright` - Add Copyright Notice
```solidity
/// @custom:interface copyright "Copyright (c) 2024 MyCompany. All rights reserved."
```

#### `import` - Add Import Statements
```solidity
/// @custom:interface import "@openzeppelin/contracts/access/IOwnable.sol";
```

#### `replace` - Replace Inheritance
```solidity
contract MyContract is Ownable {
/// @custom:interface replace Ownable with IOwnable
```

#### `remove` - Remove Inheritance
```solidity
contract MyContract is Ownable, ReentrancyGuard {
/// @custom:interface remove ReentrancyGuard
```

#### `is` - Add Interface Inheritance
```solidity
contract MyContract is Ownable {
/// @custom:interface is IDataStorage
/// @custom:interface is IEventEmitter
// Results in: interface IMyContract is IOwnable, IDataStorage, IEventEmitter
```

#### `exclude` - Exclude Functions/Events/Errors
```solidity
function debugFunction() public {
    // implementation
}
/// @custom:interface exclude debugFunction
```

#### `include` - Force Include Internal Functions
```solidity
function _internalHelper() internal view returns (uint256) {
    return someValue;
}
/// @custom:interface include _internalHelper
```

## Complete Build Pipeline

### `npx hardhat-build` - Comprehensive Build Command

Run the complete build pipeline with a single command:

```bash
# Complete build: Interface generation + Hardhat compile
npx hardhat-build

# Verbose output to see detailed progress
npx hardhat-build --verbose

# Get help
npx hardhat-build --help
```

**What it does:**
1. 🔧 **Interface Generation** (all contracts with directives)
2. 🔨 **Hardhat Contract Compilation** (`hardhat compile`)

**Smart Detection:**
- Automatically detects your package manager (npm, yarn, pnpm)
- Provides clear progress feedback and timing

## Hardhat Tasks

### `build` - Complete Build Pipeline

```bash
# Full build pipeline
npx hardhat build

# Only build interfaces (skip TS and compilation)  
npx hardhat build --interfaces

# Verbose output (use global --verbose flag)
npx hardhat build --verbose
```

### `build-interface` - Interface Generation Only

Generate interface files from contracts.

**Parameters:**
- `--contract <path>` - Path to a specific contract file (relative to contracts/ or absolute)
- `--all` - Generate interfaces for all contracts with build directives

**Examples:**
```bash
# Build single contract
npx hardhat build-interface --contract Token.sol
npx hardhat build-interface --contract contracts/Token.sol

# Build all contracts
npx hardhat build-interface --all

# Get help
npx hardhat help build-interface
```

## Programmatic Usage

You can also use the plugin programmatically in your scripts:

```typescript
import { buildInterface, buildAllInterfaces } from "hardhat-build";

// Build single contract
await buildInterface("contracts/MyContract.sol");

// Build all contracts with directives
await buildAllInterfaces();
```

Or use the complete build pipeline programmatically:

```typescript
import { HardhatBuildCLI } from "hardhat-build";

// Run complete build pipeline
const cli = new HardhatBuildCLI();
await cli.run();
```

## Path Resolution

The `build` directive supports both relative and absolute paths:

- **Relative paths** are resolved relative to the contract file's directory
- **Absolute paths** are used as-is

```solidity
// ✅ Relative to contract file (recommended)
/// @custom:interface build ../interfaces/IMyContract.sol

// ✅ Absolute path
/// @custom:interface build /path/to/interfaces/IMyContract.sol
```

## Function Inclusion Rules

By default, the plugin includes:
- ✅ `external` functions
- ✅ `public` functions (converted to `external` in interface)
- ✅ Public state variables (as getter functions)
- ✅ All events (unless explicitly excluded)
- ✅ All custom errors (unless explicitly excluded)

By default, the plugin excludes:
- ❌ `internal` functions (unless explicitly included)
- ❌ `private` functions (unless explicitly included)
- ❌ Constructor functions
- ❌ Modifier definitions

## Examples

### Comprehensive Contract Example

See [`examples/ComprehensiveExample.sol`](./examples/ComprehensiveExample.sol) for a feature-rich contract that demonstrates **every interface directive**:

- ✅ **build** - Output path specification
- ✅ **copyright** - Copyright notice inclusion  
- ✅ **import** - Adding necessary imports
- ✅ **replace** - Inheritance replacement (ERC20 → IERC20, Ownable → IOwnable)
- ✅ **remove** - Inheritance removal (ReentrancyGuard, Pausable)
- ✅ **is** - Additional interface inheritance (IDataStorage, IEventEmitter)
- ✅ **exclude** - Function/event exclusion (emergency functions, debug events)
- ✅ **include** - Internal function inclusion (_calculateStakingMultiplier)
- ✅ **getter** - Custom getter generation (totalFeesCollected, autoFeeCollection)

**Build the example interface:**
```bash
# Copy the example to your contracts folder
cp node_modules/hardhat-build/examples/ComprehensiveExample.sol contracts/

# Generate the interface
npx hardhat build-interface --contract ComprehensiveExample.sol
```

This will create `interfaces/IComprehensiveExample.sol` with all directives applied, showing inheritance changes, selective inclusions/exclusions, and comprehensive natspec documentation.

## Requirements

- Node.js >= 16.0.0
- Hardhat >= 2.0.0

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/TechnicallyWeb3/hardhat-build/issues).

## Usage

### Command Line Interface

```bash
# Build single contract interface
npx ts-node src/buildInterface.ts contracts/MyContract.sol

# Build all contracts with interface directives
npx ts-node src/buildInterface.ts all

# Force regeneration (skip timestamp checks)
npx ts-node src/buildInterface.ts all --force

# Production usage (compiled)
node dist/buildInterface.js all --force
```

### Hardhat Integration

```bash
# Build all contracts with directives
npx hardhat build-interface --all

# Force regeneration of all interfaces
npx hardhat build-interface --all --force

# Complete build pipeline
npx hardhat build --interfaces --force
```

### Performance

The tool automatically skips up-to-date interface files by comparing timestamps. Use `--force` to regenerate all files regardless of timestamps. 