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
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
const buildInterface_1 = require("../buildInterface");
const cli_1 = require("../cli");
(0, config_1.task)("build", "Complete build pipeline: TypeScript, Hardhat compile, and interface generation")
    .addFlag("interfaces", "Only build interfaces (skip TypeScript and Hardhat compilation)")
    .addFlag("force", "Force regeneration of interface files even if they are up to date")
    .setAction(async (taskArgs, hre) => {
    if (taskArgs.interfaces) {
        // Only build interfaces
        await (0, buildInterface_1.buildAllInterfaces)(taskArgs.force);
    }
    else {
        // Run full build pipeline
        console.log("🚀 Running complete build pipeline...\n");
        // Check for global verbose flag
        if (process.argv.includes('--verbose')) {
            // Already set
        }
        const cli = new cli_1.HardhatBuildCLI();
        await cli.run();
    }
});
//# sourceMappingURL=buildInterface.js.map