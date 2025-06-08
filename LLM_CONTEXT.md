# LLM Context: Hardhat Build Interface Plugin

## Project Overview
**Hardhat Build** is a comprehensive TypeScript plugin that extends Hardhat with advanced interface generation capabilities and unified build pipeline automation. This tool represents a significant advancement in Solidity development workflow optimization.

## Core Architecture

### 1. Interface Directive System
The plugin introduces a novel comment-based directive system that allows developers to control interface generation through embedded contract comments:

```solidity
/// !interface build ../interfaces/IMyContract.sol
/// !interface copyright "Copyright 2025 MyCompany"
/// !interface import "hardhat/console.sol";
/// !interface replace Ownable with IOwnable
/// !interface is IDataStorage
/// !interface is IEventEmitter
/// !interface exclude emergencyWithdraw
/// !interface include _calculateRewards
/// !interface getter stakingBalance
contract MyContract {
    // contract implementation
}
```

**Key Innovation**: Unlike traditional interface generators that require external configuration files, this system embeds generation directives directly in the contract source code, making interface management more maintainable and version-controlled.

### 2. Advanced AST Processing Engine
The core engine (`src/buildInterface.ts`) contains sophisticated AST manipulation capabilities:

- **Natspec Preservation**: Maintains both `///` and `/** */` documentation styles during interface generation
- **Inheritance Transformation**: Intelligent replacement of concrete contracts with their interface equivalents
- **Selective Function Processing**: Fine-grained control over which functions appear in generated interfaces
- **Custom Getter Generation**: Automatic generation of getter functions for private/internal state variables

### 3. Build Pipeline Automation
The CLI (`src/cli.ts`) provides a unified build experience:

```bash
npx hardhat-build              # Complete pipeline
npx hardhat build              # Hardhat task version
npx hardhat build --interfaces # Interface-only builds
```

**Pipeline Stages**:
1. TypeScript compilation (dist/)
2. Hardhat contract compilation (artifacts/)  
3. Interface generation (interfaces/)

### 4. Hardhat Task Integration
Seamless integration with existing Hardhat workflows through custom tasks:

- `build` - Complete build pipeline
- `build-interface` - Interface generation only
- Auto-registration via plugin entry point

## Key Files and Their Purposes

### `src/buildInterface.ts` (Core Engine - 675 lines)
- **InterfaceGenerator class**: Main processing engine
- **DirectiveParser**: Processes interface comments
- **ASTTransformer**: Modifies Solidity AST for interface generation
- **FileWriter**: Handles output file generation with proper path resolution

### `src/cli.ts` (Standalone CLI - 200+ lines)
- **BuildPipeline class**: Orchestrates complete build process
- **PackageManager detection**: Smart npm/yarn/pnpm handling
- **Progress tracking**: User-friendly build status reporting
- **Error handling**: Comprehensive failure recovery

### `src/tasks/buildInterface.ts` (Hardhat Integration)
- **Task registration**: Seamless Hardhat workflow integration
- **Parameter handling**: CLI argument processing
- **Error reporting**: Hardhat-consistent error messages

### `src/types.ts` (TypeScript Definitions)
- **InterfaceDirective**: Type definitions for directive system
- **BuildOptions**: Configuration interfaces
- **Error types**: Structured error handling

## Advanced Features

### Relative Path Resolution
**Challenge**: Interface output paths must resolve correctly relative to the contract file location, not the build script location.

**Solution**: The system calculates relative paths from the contract's directory:
```typescript
private resolvePath(contractPath: string, outputPath: string): string {
  const contractDir = path.dirname(contractPath);
  return path.resolve(contractDir, outputPath);
}
```

### Natspec Documentation Preservation
**Challenge**: Maintaining developer documentation during AST transformation.

**Solution**: Dual-parser system that preserves both comment styles:
```typescript
private preserveNatspec(node: any): string[] {
  const comments = [];
  // Handle /// style comments
  if (node.leadingComments) {
    comments.push(...node.leadingComments);
  }
  // Handle /** */ style comments
  if (node.documentation) {
    comments.push(node.documentation);
  }
  return comments;
}
```

### Smart Package Manager Detection
**Challenge**: Support for npm, yarn, and pnpm across different environments.

**Solution**: File-system based detection with fallback mechanisms:
```typescript
private detectPackageManager(): 'npm' | 'yarn' | 'pnpm' {
  if (fs.existsSync(path.join(this.cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(this.cwd, 'yarn.lock'))) return 'yarn';
  return 'npm';
}
```

## Development Patterns and Best Practices

### Error Handling Strategy
The codebase implements comprehensive error handling with contextual information:

```typescript
try {
  // operation
} catch (error) {
  throw new Error(`Failed to ${operation}: ${error.message}\nContext: ${context}`);
}
```

### Logging and Progress Reporting
User-friendly progress indication throughout long-running operations:

```typescript
if (verbose) {
  console.log(`🔨 Step ${currentStep}/${totalSteps}: ${stepName}`);
}
```

### TypeScript Best Practices
- Strict type definitions for all interfaces
- Comprehensive error types
- Proper async/await patterns
- Clear separation of concerns

## Testing and Quality Assurance

### Manual Testing Approach
The codebase has been extensively tested through manual verification:

1. **Single Contract Testing**: Verified interface generation for individual contracts
2. **Batch Processing**: Tested `all` flag functionality across multiple contracts
3. **Path Resolution**: Verified relative path handling across different directory structures
4. **Error Scenarios**: Tested failure modes and recovery mechanisms

### Integration Testing
- Hardhat task integration verified
- CLI tool functionality confirmed
- Package manager compatibility tested

## Performance Considerations

### File I/O Optimization
- Batch file operations where possible
- Efficient AST parsing with minimal memory footprint
- Smart caching of parsed results

### Build Pipeline Efficiency
- Parallel execution of independent operations
- Skip unnecessary compilation steps
- Intelligent dependency detection

## Extension Points for AI Assistance

### Code Generation Assistance
When helping users with this codebase, focus on:

1. **Directive Syntax**: Help users understand the interface directive comment system
2. **Configuration**: Assist with Hardhat configuration and plugin setup
3. **Troubleshooting**: Help debug path resolution issues and build failures
4. **Customization**: Guide users in extending the directive system for their needs

### Common User Issues
- **Path Resolution**: Most common issue is incorrect relative paths in build directives
- **TypeScript Compilation**: Users often need help with tsconfig.build.json setup
- **Hardhat Integration**: Configuration of hardhat.config.js/ts for plugin loading

### Enhancement Opportunities
- **Custom Directive Types**: The directive system is extensible for new comment types
- **Output Format Options**: Could be extended to support different interface formats
- **IDE Integration**: Potential for VSCode extension development
- **Testing Framework**: Automated testing suite could be added

## Security Considerations

### File System Access
The tool requires read access to:
- Contract source files
- Package configuration files (package.json, lock files)
- TypeScript configuration files

And write access to:
- Interface output directories
- Compiled output directories (dist/, artifacts/)

### Command Execution
The CLI executes system commands for:
- TypeScript compilation (`tsc`)
- Hardhat compilation (`hardhat compile`)
- Package manager operations

All commands are constructed with user-provided paths, requiring input validation.

## Licensing and Distribution

**License**: MIT  
**Copyright**: TechnicallyWeb3 (2025)  
**Distribution**: NPM package `hardhat-build`

The MIT license allows for commercial use, modification, and distribution while maintaining copyright attribution requirements.

## Usage Examples

```bash
# Build single contract interface
npx ts-node src/buildInterface.ts contracts/MyContract.sol

# Build all contracts with interface directives
npx ts-node src/buildInterface.ts all

# Force regeneration (skip timestamp checks)
npx ts-node src/buildInterface.ts all --force

# Hardhat integration
npx hardhat build-interface --all --force
npx hardhat build --interfaces --force

# Advanced build pipeline
npx hardhat-build --interfaces-only --force
```

## Performance Features

- **Automatic Skip**: Files are automatically skipped if the interface is newer than the source contract
- **Force Flag**: Use `--force` to bypass timestamp checks and regenerate all files
- **Batch Processing**: Efficiently processes multiple contracts in a single command
- **Clear Feedback**: Shows which files were skipped vs. regenerated

---

This context provides comprehensive understanding for AI assistants helping users with the Hardhat Build plugin. The focus should be on practical assistance with configuration, troubleshooting, and effective usage of the interface generation system. 