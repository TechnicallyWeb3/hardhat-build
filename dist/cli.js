#!/usr/bin/env node
"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HardhatBuildCLI = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const buildInterface_1 = require("./buildInterface");
class HardhatBuildCLI {
    constructor() {
        this.cwd = process.cwd();
        this.verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
        this.force = process.argv.includes('--force');
    }
    log(message) {
        console.log(`🔨 ${message}`);
    }
    logVerbose(message) {
        if (this.verbose) {
            console.log(`   ${message}`);
        }
    }
    async runCommand(step) {
        return new Promise((resolve) => {
            this.log(`${step.name}...`);
            this.logVerbose(`Running: ${step.command} ${step.args.join(' ')}`);
            const options = {
                cwd: this.cwd,
                stdio: this.verbose ? 'inherit' : 'pipe',
                shell: true
            };
            const child = (0, child_process_1.spawn)(step.command, step.args, options);
            child.on('close', (code) => {
                if (code === 0) {
                    this.log(`✅ ${step.name} completed successfully`);
                    resolve(true);
                }
                else {
                    if (step.optional) {
                        this.log(`⚠️  ${step.name} failed (optional step, continuing...)`);
                        resolve(true);
                    }
                    else {
                        this.log(`❌ ${step.name} failed with exit code ${code}`);
                        resolve(false);
                    }
                }
            });
            child.on('error', (error) => {
                if (step.optional) {
                    this.log(`⚠️  ${step.name} failed: ${error.message} (optional step, continuing...)`);
                    resolve(true);
                }
                else {
                    this.log(`❌ ${step.name} failed: ${error.message}`);
                    resolve(false);
                }
            });
        });
    }
    detectPackageManager() {
        if (fs_1.default.existsSync(path_1.default.join(this.cwd, 'yarn.lock'))) {
            return 'yarn';
        }
        else if (fs_1.default.existsSync(path_1.default.join(this.cwd, 'pnpm-lock.yaml'))) {
            return 'pnpm';
        }
        else {
            return 'npm';
        }
    }
    hasTypeScript() {
        const packageJsonPath = path_1.default.join(this.cwd, 'package.json');
        if (!fs_1.default.existsSync(packageJsonPath))
            return false;
        try {
            const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf8'));
            return !!(packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript);
        }
        catch {
            return false;
        }
    }
    hasTsconfigBuild() {
        return fs_1.default.existsSync(path_1.default.join(this.cwd, 'tsconfig.build.json')) ||
            fs_1.default.existsSync(path_1.default.join(this.cwd, 'tsconfig.json'));
    }
    getHardhatCommand() {
        const packageManager = this.detectPackageManager();
        if (packageManager === 'yarn') {
            return 'yarn';
        }
        else if (packageManager === 'pnpm') {
            return 'pnpm';
        }
        else {
            return 'npx';
        }
    }
    getHardhatArgs() {
        const packageManager = this.detectPackageManager();
        if (packageManager === 'yarn') {
            return ['hardhat'];
        }
        else if (packageManager === 'pnpm') {
            return ['hardhat'];
        }
        else {
            return ['hardhat'];
        }
    }
    async run() {
        const startTime = Date.now();
        console.log('🚀 Starting Hardhat Build Pipeline...\n');
        const steps = [];
        // Step 1: TypeScript compilation (if applicable)
        if (this.hasTypeScript() && this.hasTsconfigBuild()) {
            const packageManager = this.detectPackageManager();
            const tscCommand = packageManager === 'npm' ? 'npx' : packageManager;
            const tscArgs = packageManager === 'npm' ? ['tsc'] : ['tsc'];
            if (fs_1.default.existsSync(path_1.default.join(this.cwd, 'tsconfig.build.json'))) {
                tscArgs.push('-p', 'tsconfig.build.json');
            }
            steps.push({
                name: 'TypeScript Compilation',
                command: tscCommand,
                args: tscArgs,
                optional: true
            });
        }
        // Step 2: Hardhat compilation (generate artifacts)
        const hardhatCommand = this.getHardhatCommand();
        const hardhatBaseArgs = this.getHardhatArgs();
        steps.push({
            name: 'Hardhat Contract Compilation',
            command: hardhatCommand,
            args: [...hardhatBaseArgs, 'compile'],
            optional: false
        });
        // Step 3: Interface generation - call directly instead of spawning
        // We'll handle this separately after the other steps
        // Execute all steps
        let success = true;
        for (const step of steps) {
            const result = await this.runCommand(step);
            if (!result) {
                success = false;
                break;
            }
            console.log(); // Add spacing between steps
        }
        // Handle interface generation directly
        if (success) {
            try {
                this.log('Interface Generation...');
                await (0, buildInterface_1.buildAllInterfaces)(this.force);
                this.log('✅ Interface Generation completed successfully');
                console.log(); // Add spacing
            }
            catch (error) {
                this.log(`❌ Interface Generation failed: ${error}`);
                success = false;
            }
        }
        // Summary
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        if (success) {
            console.log('🎉 Build Pipeline Complete!');
            console.log(`✅ All steps completed successfully in ${duration}s\n`);
            console.log('📁 Generated outputs:');
            if (this.hasTypeScript()) {
                console.log('   • TypeScript compiled to dist/');
            }
            console.log('   • Contract artifacts in artifacts/');
            console.log('   • Interface files in interfaces/');
        }
        else {
            console.log('❌ Build Pipeline Failed!');
            console.log(`💥 Build failed after ${duration}s\n`);
            process.exit(1);
        }
    }
    static async executeInterfaces(force = false) {
        console.log('🔍 Building all interfaces...');
        try {
            await (0, buildInterface_1.buildAllInterfaces)(force);
            console.log('✅ Interface generation completed successfully');
        }
        catch (error) {
            console.error('❌ Interface generation failed:', error);
            process.exit(1);
        }
    }
}
exports.HardhatBuildCLI = HardhatBuildCLI;
// CLI entry point
async function main() {
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🔨 Hardhat Build - Complete Build Pipeline
   Advanced interface generation and unified build automation

USAGE:
  npx hardhat-build [options]

OPTIONS:
  --verbose, -v        Show detailed output with command execution
  --help, -h          Show this help message
  --interfaces        Run interface generation only (skip compilation)
  --force             Force regeneration of interface files even if they are up to date

WHAT IT DOES:
  1. 📦 Compiles TypeScript (if tsconfig.build.json exists)
  2. 🔨 Runs 'hardhat compile' to generate contract artifacts
  3. 🔧 Builds all interfaces with /// !interface directives
  4. 📊 Reports build status and generated outputs

INTERFACE DIRECTIVES:
  Add these comments to your contracts to control interface generation:
  
  /// !interface build ../interfaces/IMyContract.sol
  /// !interface copyright "Copyright 2025 MyCompany"
  /// !interface import "hardhat/console.sol";
  /// !interface replace Ownable with IOwnable
  /// !interface exclude emergencyWithdraw
  /// !interface include _calculateRewards
  /// !interface getter stakingBalance

EXAMPLES:
  npx hardhat-build                    # Run complete build pipeline
  npx hardhat-build --verbose         # Run with detailed output
  npx hardhat-build --interfaces      # Generate interfaces only
  npx hardhat-build --force           # Force regeneration of all files
  npx hardhat-build --interfaces --force       # Force interface regeneration only

HARDHAT INTEGRATION:
  Add to hardhat.config.js:
    require('hardhat-build');
  
  Then use:
    npx hardhat build                    # Complete pipeline
    npx hardhat build --interfaces      # Interface-only builds
    npx hardhat build --interfaces --force  # Force interface regeneration

OUTPUTS:
  • dist/          TypeScript compiled files
  • artifacts/     Hardhat compilation artifacts
  • interfaces/    Generated interface files with natspec

For more information: https://github.com/TechnicallyWeb3/hardhat-build
    `);
        return;
    }
    // Special case: if being called for interfaces only
    if (args.includes('--interfaces')) {
        const force = args.includes('--force');
        await HardhatBuildCLI.executeInterfaces(force);
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
//# sourceMappingURL=cli.js.map