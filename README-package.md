# hardhat-build-interface

[![npm version](https://badge.fury.io/js/hardhat-build-interface.svg)](https://badge.fury.io/js/hardhat-build-interface)

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

**No additional setup required!** Hardhat projects include TypeScript and ts-node dependencies.

## Quick Start

### Hardhat Integration (Recommended)

```bash
# Add interface directive to your contract
/// !interface build ../interfaces/IMyContract.sol

# Generate interfaces
npx hardhat build --interfaces

# Force regeneration of all interfaces
npx hardhat build --interfaces --force

# Complete build pipeline
npx hardhat build
```

### CLI Usage (Works Everywhere)

```bash
# Standalone CLI binary (includes Hardhat as dependency)
npx hardhat-build --force

# TypeScript source access (for development)
npx ts-node node_modules/hardhat-build/src/buildInterface.ts all
```

### Performance

The tool automatically skips up-to-date interface files by comparing timestamps between source contracts and generated interfaces. Use `--force` to bypass this optimization and regenerate all files.

## Interface Directives

Control interface generation with special comments in your contracts:

### Required Directives

#### `build` - Specify Output Path
```solidity
/// !interface build ../interfaces/IMyContract.sol
```

### Optional Directives

#### `copyright` - Add Copyright Notice
```solidity
/// !interface copyright "Copyright (c) 2024 MyCompany. All rights reserved."
```

#### `import` - Add Import Statements
```solidity
/// !interface import "@openzeppelin/contracts/access/IOwnable.sol";
```

#### `replace` - Replace Inheritance
```solidity
contract MyContract is Ownable {
/// !interface replace Ownable with IOwnable
```

#### `remove` - Remove Inheritance
```solidity
contract MyContract is Ownable, ReentrancyGuard {
/// !interface remove ReentrancyGuard
```

#### `is` - Add Interface Inheritance
```solidity
contract MyContract is Ownable {
/// !interface is IDataStorage
/// !interface is IEventEmitter
// Results in: interface IMyContract is IOwnable, IDataStorage, IEventEmitter
```

#### `exclude` - Exclude Functions/Events/Errors
```solidity
function debugFunction() public {
    // implementation
}
/// !interface exclude debugFunction
```

#### `include` - Force Include Internal Functions
```solidity
function _internalHelper() internal view returns (uint256) {
    return someValue;
}
/// !interface include _internalHelper
```

## Hardhat Tasks

### `build-interface`

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
import { buildInterface, buildAllInterfaces } from "hardhat-build-interface";

// Build single contract
await buildInterface("contracts/MyContract.sol");

// Build all contracts with directives
await buildAllInterfaces();
```

## Path Resolution

The `build` directive supports both relative and absolute paths:

- **Relative paths** are resolved relative to the contract file's directory
- **Absolute paths** are used as-is

```solidity
// ✅ Relative to contract file (recommended)
/// !interface build ../interfaces/IMyContract.sol

// ✅ Absolute path
/// !interface build /path/to/interfaces/IMyContract.sol
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

See the [examples directory](./examples) for complete working examples.

## Requirements

- Node.js >= 16.0.0
- Hardhat >= 2.0.0

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/TechnicallyWeb3/hardhat-build/issues).

## Quick Start

```bash
# Install the package
npm install --save-dev hardhat-build

# Add to your hardhat.config.js
require('hardhat-build');

# Build all interfaces
npx hardhat build-interface --all

# Force regeneration of all interfaces
npx hardhat build-interface --all --force

# Complete build pipeline
npx hardhat build --interfaces --force
```

## Performance

The tool automatically skips up-to-date interface files by comparing timestamps between source contracts and generated interfaces. Use `--force` to bypass this optimization and regenerate all files. 