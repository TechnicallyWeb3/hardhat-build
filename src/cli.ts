#!/usr/bin/env node

/**
 * Copyright (C) 2025 TechnicallyWeb3
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { spawn, SpawnOptions } from 'child_process';
import path from 'path';
import fs from 'fs';
import { buildAllInterfaces } from './buildInterface';

interface BuildStep {
  name: string;
  command: string;
  args: string[];
  optional?: boolean;
}

class HardhatBuildCLI {
  private cwd: string;
  private verbose: boolean;
  private force: boolean;

  constructor() {
    this.cwd = process.cwd();
    this.verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
    this.force = process.argv.includes('--force');
  }

  private log(message: string): void {
    console.log(`🔨 ${message}`);
  }

  private logVerbose(message: string): void {
    if (this.verbose) {
      console.log(`   ${message}`);
    }
  }

  private async runCommand(step: BuildStep): Promise<boolean> {
    return new Promise((resolve) => {
      this.log(`${step.name}...`);
      this.logVerbose(`Running: ${step.command} ${step.args.join(' ')}`);

      const options: SpawnOptions = {
        cwd: this.cwd,
        stdio: this.verbose ? 'inherit' : 'pipe',
        shell: true
      };

      const child = spawn(step.command, step.args, options);
      
      let stderr = '';
      let stdout = '';
      
      // Capture output when not in verbose mode
      if (!this.verbose) {
        if (child.stderr) {
          child.stderr.on('data', (data) => {
            stderr += data.toString();
          });
        }
        
        if (child.stdout) {
          child.stdout.on('data', (data) => {
            stdout += data.toString();
          });
        }
      }

      child.on('close', (code) => {
        if (code === 0) {
          this.log(`✅ ${step.name} completed successfully`);
          resolve(true);
        } else {
          if (step.optional) {
            this.log(`⚠️  ${step.name} failed (optional step, continuing...)`);
            if (!this.verbose && stderr) {
              console.error(stderr.trim());
            }
            resolve(true);
          } else {
            this.log(`❌ ${step.name} failed with exit code ${code}`);
            if (!this.verbose && stderr) {
              console.error(stderr.trim());
            }
            resolve(false);
          }
        }
      });

      child.on('error', (error) => {
        if (step.optional) {
          this.log(`⚠️  ${step.name} failed: ${error.message} (optional step, continuing...)`);
          resolve(true);
        } else {
          this.log(`❌ ${step.name} failed: ${error.message}`);
          resolve(false);
        }
      });
    });
  }

  private detectPackageManager(): string {
    if (fs.existsSync(path.join(this.cwd, 'yarn.lock'))) {
      return 'yarn';
    } else if (fs.existsSync(path.join(this.cwd, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    } else {
      return 'npm';
    }
  }

  private getHardhatCommand(): string {
    const packageManager = this.detectPackageManager();
    
    if (packageManager === 'yarn') {
      return 'yarn';
    } else if (packageManager === 'pnpm') {
      return 'pnpm';
    } else {
      return 'npx';
    }
  }

  private getHardhatArgs(): string[] {
    const packageManager = this.detectPackageManager();
    
    if (packageManager === 'yarn') {
      return ['hardhat'];
    } else if (packageManager === 'pnpm') {
      return ['hardhat'];
    } else {
      return ['hardhat'];
    }
  }

  public async run(): Promise<void> {
    const startTime = Date.now();
    
    console.log('🚀 Starting Hardhat Build Pipeline...\n');

    // Step 1: Interface generation - FIRST so both TS and Solidity can use interfaces
    let success = true;
    
    try {
      this.log('Interface Generation...');
      await buildAllInterfaces(this.force);
      this.log('✅ Interface Generation completed successfully');
      console.log(); // Add spacing
    } catch (error) {
      this.log(`❌ Interface Generation failed: ${error}`);
      success = false;
    }

    if (!success) {
      console.log('❌ Build Pipeline Failed!');
      console.log('💥 Interface generation failed - stopping build\n');
      process.exit(1);
    }

    const steps: BuildStep[] = [];

    // Step 2: Hardhat compilation (can now import interfaces)
    const hardhatCommand = this.getHardhatCommand();
    const hardhatBaseArgs = this.getHardhatArgs();
    
    steps.push({
      name: 'Hardhat Contract Compilation',
      command: hardhatCommand,
      args: [...hardhatBaseArgs, 'compile'],
      optional: false
    });

    // Execute remaining steps in order
    for (const step of steps) {
      const result = await this.runCommand(step);
      if (!result) {
        success = false;
        break;
      }
      console.log(); // Add spacing between steps
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (success) {
      console.log('🎉 Build Pipeline Complete!');
      console.log(`✅ All steps completed successfully in ${duration}s\n`);
      
      console.log('📁 Generated outputs:');
      console.log('   • Interface files in interfaces/');
      console.log('   • Contract artifacts in artifacts/');
    } else {
      console.log('❌ Build Pipeline Failed!');
      console.log(`💥 Build failed after ${duration}s\n`);
      process.exit(1);
    }
  }

  public static async executeInterfaces(force: boolean = false, files?: string[]): Promise<void> {
    if (files && files.length > 0) {
      // Filter out flags from files list
      const contractFiles = files.filter(file => !file.startsWith('--'));
      
      if (contractFiles.length === 0) {
        console.log('🔍 Building all interfaces...');
        
        try {
          await buildAllInterfaces(force);
          console.log('✅ Interface generation completed successfully');
        } catch (error) {
          console.error('❌ Interface generation failed:', error);
          process.exit(1);
        }
        return;
      }
      
      console.log(`🔍 Building interfaces for ${contractFiles.length} specified file(s)...`);
      
      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      
      for (const file of contractFiles) {
        try {
          console.log(`🔨 Building interface for: ${file}`);
          const { InterfaceGenerator } = await import('./buildInterface');
          
          const generator = new InterfaceGenerator(file, force);
          const result = generator.writeInterface();
          
          if (result === 'generated') {
            successCount++;
          } else if (result === 'skipped') {
            skippedCount++;
          }
        } catch (error) {
          console.error(`❌ Error building interface for ${file}:`, error);
          errorCount++;
        }
      }
      
      console.log();
      console.log(`✅ Successfully built ${successCount} interface(s)`);
      if (skippedCount > 0) {
        console.log(`⏭️  Skipped ${skippedCount} up-to-date interface(s)`);
      }
      if (errorCount > 0) {
        console.log(`❌ Failed to build ${errorCount} interface(s)`);
      }
    } else {
      console.log('🔍 Building all interfaces...');
      
      try {
        await buildAllInterfaces(force);
        console.log('✅ Interface generation completed successfully');
      } catch (error) {
        console.error('❌ Interface generation failed:', error);
        process.exit(1);
      }
    }
  }
}

// CLI entry point
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔨 Hardhat Build - Complete Build Pipeline
   Advanced interface generation and unified build automation

USAGE:
  npx hardhat-build [options] [files...]

OPTIONS:
  --verbose, -v        Show detailed output with command execution
  --help, -h          Show this help message
  --interfaces        Run interface generation only (skip compilation)
  --force             Force regeneration of interface files even if they are up to date

WHAT IT DOES:
  1. 🔧 Builds all interfaces with /// !interface directives (FIRST)
  2. 🔨 Runs 'hardhat compile' to generate contract artifacts
  3. 📊 Reports build status and generated outputs

This ensures interfaces are available when Solidity contracts import them.

INTERFACE DIRECTIVES:
  Add these comments to your contracts to control interface generation:
  
  /// !interface build "./interfaces/IMyContract.sol"
  /// !interface build "../interfaces/IMyContract.sol"  # With quotes for paths with spaces
  
BEST PRACTICES:
  📁 Use the interfaces/ directory with I{ContractName}.sol naming:
     /// !interface build "./interfaces/IToken.sol"
     /// !interface build "./interfaces/IStaking.sol"
  
  📝 Add to .gitignore to keep repos clean:
     **/interfaces/  # Generated interface files
  /// !interface module "@openzeppelin/contracts/access/Ownable.sol" to "./interfaces/IOwnable.sol"
  /// !interface module "@openzeppelin/contracts/access/Ownable.sol" to "./interfaces/IOwnable.sol" --remove Context
  /// !interface module "contracts/MyModule.sol" to "./interfaces/IMyModule.sol" --replace Ownable with IOwnable --is IAccessControl
  /// !interface copyright "Copyright 2025 MyCompany"
  /// !interface import "hardhat/console.sol"
  /// !interface replace Ownable with IOwnable
  /// !interface exclude emergencyWithdraw
  /// !interface include _calculateRewards
  /// !interface getter stakingBalance
  /// !interface is IDataStorage, IEventEmitter

MODULE FLAGS:
  --remove <contract>              Remove inheritance from specified contract
  --replace <old> with <new>       Replace contract types in inheritance AND function signatures
  --is <interfaces>                Add comma-separated interfaces to inheritance

MODULE ENHANCEMENTS:
  • --replace now works on function parameters, return types, events, and errors
  • Smart type-context matching avoids replacing variable/function names
  • Supports arrays (Ownable[]), mappings (mapping(address => Ownable)), complex types
  • Example: "function test(Ownable owner) returns (Ownable[])" becomes "function test(IOwnable owner) returns (IOwnable[])"

EXAMPLES:
  npx hardhat-build                           # Run complete build pipeline
  npx hardhat-build --verbose                # Run with detailed output
  npx hardhat-build --interfaces             # Generate all interfaces only
  npx hardhat-build --interfaces contracts/DataPointStorage.sol  # Generate specific interface
  npx hardhat-build --interfaces contracts/Storage.sol contracts/Registry.sol  # Multiple files
  npx hardhat-build --force                  # Force regeneration of all files
  npx hardhat-build --interfaces --force     # Force interface regeneration only

HARDHAT INTEGRATION:
  Add to hardhat.config.js:
    require('hardhat-build');
  
  Then use:
    npx hardhat build                               # Complete pipeline
    npx hardhat build --interfaces                 # All interface-only builds
    npx hardhat build --interfaces contracts/Storage.sol  # Specific interface builds
    npx hardhat build --interfaces contracts/A.sol contracts/B.sol  # Multiple files
    npx hardhat build --interfaces --force         # Force interface regeneration

OUTPUTS:
  • artifacts/     Hardhat compilation artifacts
  • interfaces/    Generated interface files with natspec

For more information: https://github.com/TechnicallyWeb3/hardhat-build
    `);
    return;
  }

  // Special case: if being called for interfaces only
  if (args.includes('--interfaces')) {
    const force = args.includes('--force');
    const files = args.slice(args.indexOf('--interfaces') + 1);
    await HardhatBuildCLI.executeInterfaces(force, files);
    return;
  }

  const cli = new HardhatBuildCLI();
  await cli.run();
}

// Only run if this file is being executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

export { HardhatBuildCLI }; 