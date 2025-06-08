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

import { task } from "hardhat/config";
import { buildInterface, buildAllInterfaces } from "../buildInterface";
import { HardhatBuildCLI } from "../cli";
import fs from 'fs';
import path from 'path';

task("build-interface", "Build an interface from a contract")
  .addOptionalParam("contract", "The contract file path (can be relative to contracts/ or absolute)")
  .addFlag("all", "Generate interfaces for all contracts with build directives")
  .addFlag("force", "Force regeneration of interface files even if they are up to date")
  .setAction(async (taskArgs, hre) => {
    if (taskArgs.all) {
      await buildAllInterfaces(taskArgs.force);
    } else if (taskArgs.contract) {
      // Handle both relative and absolute paths
      let contractPath = taskArgs.contract;
      
      // If it's not an absolute path and doesn't start with contracts/, prepend contracts/
      if (!path.isAbsolute(contractPath) && !contractPath.startsWith('contracts/')) {
        contractPath = path.join("contracts", contractPath);
      }
      
      if (!fs.existsSync(contractPath)) {
        console.error(`Contract not found: ${contractPath}`);
        return;
      }
      await buildInterface(contractPath, taskArgs.force);
    } else {
      console.error("Please specify either --contract <path> or --all");
      console.error("Examples:");
      console.error("  npx hardhat build-interface --contract Lock.sol");
      console.error("  npx hardhat build-interface --contract contracts/Lock.sol");
      console.error("  npx hardhat build-interface --all");
      console.error("  npx hardhat build-interface --all --force");
      return;
    }
  });

task("build", "Complete build pipeline: TypeScript, Hardhat compile, and interface generation")
  .addFlag("interfaces", "Only build interfaces (skip TypeScript and Hardhat compilation)")
  .addFlag("force", "Force regeneration of interface files even if they are up to date")
  .setAction(async (taskArgs, hre) => {
    if (taskArgs.interfaces) {
      // Only build interfaces
      await buildAllInterfaces(taskArgs.force);
    } else {
      // Run full build pipeline
      console.log("🚀 Running complete build pipeline...\n");
      
      // Check for global verbose flag
      if (process.argv.includes('--verbose')) {
        // Already set
      }
      
      const cli = new HardhatBuildCLI();
      await cli.run();
    }
  });

export {}; 