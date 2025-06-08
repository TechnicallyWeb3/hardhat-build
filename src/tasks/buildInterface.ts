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
import { buildAllInterfaces } from "../buildInterface";
import { HardhatBuildCLI } from "../cli";

task("build", "Complete build pipeline: interface generation and Hardhat compile")
  .addFlag("interfaces", "Only build interfaces (skip Hardhat compilation)")
  .addFlag("force", "Force regeneration of interface files even if they are up to date")
  .addOptionalVariadicPositionalParam("files", "Optional contract files to process (default: all with directives)")
  .setAction(async (taskArgs, hre) => {
    if (taskArgs.interfaces) {
      // Only build interfaces
      if (taskArgs.files && taskArgs.files.length > 0) {
        console.log(`🔍 Building interfaces for ${taskArgs.files.length} specified file(s)...`);
        
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        
        for (const file of taskArgs.files) {
          try {
            console.log(`🔨 Building interface for: ${file}`);
            const { InterfaceGenerator } = await import("../buildInterface");
            
            const generator = new InterfaceGenerator(file, taskArgs.force);
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
        await buildAllInterfaces(taskArgs.force);
      }
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