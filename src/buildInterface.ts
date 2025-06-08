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

import fs from 'fs';
import path from 'path';

interface InterfaceDirective {
  type: 'build' | 'import' | 'replace' | 'remove' | 'exclude' | 'include' | 'getter' | 'copyright' | 'is';
  content: string;
}

interface ParsedFunction {
  name: string;
  visibility: 'external' | 'public' | 'internal' | 'private';
  stateMutability: 'pure' | 'view' | 'payable' | 'nonpayable';
  parameters: string;
  returnType: string;
  modifiers: string[];
  fullSignature: string;
  natspec: string;
  lineNumber: number;
}

interface ParsedEvent {
  name: string;
  parameters: string;
  fullSignature: string;
  natspec: string;
  lineNumber: number;
}

interface ParsedError {
  name: string;
  parameters: string;
  fullSignature: string;
  natspec: string;
  lineNumber: number;
}

interface ParsedVariable {
  name: string;
  type: string;
  visibility: 'public' | 'internal' | 'private';
  isConstant: boolean;
  fullSignature: string;
  natspec: string;
  lineNumber: number;
}

interface ParsedContract {
  name: string;
  natspec: string;
  inheritance: string;
}

class InterfaceGenerator {
  private content: string;
  private lines: string[];
  private directives: Map<number, InterfaceDirective[]> = new Map();
  private buildPath: string = '';
  private contractPath: string;
  private importDirectives: string[] = [];
  private replaceDirectives: Map<string, string> = new Map();
  private removeDirectives: Set<string> = new Set();
  private excludeDirectives: Set<string> = new Set();
  private includeDirectives: Set<string> = new Set();
  private getterDirectives: Set<string> = new Set();
  private copyrightNotice: string = '';
  private isDirectives: string[] = [];
  private force: boolean;

  constructor(contractPath: string, force: boolean = false) {
    this.contractPath = contractPath;
    this.force = force;
    this.content = fs.readFileSync(contractPath, 'utf8');
    this.lines = this.content.split('\n');
    this.parseDirectives();
  }

  private parseDirectives(): void {
    this.lines.forEach((line, index) => {
      const directiveMatch = line.match(/\/\/\/ !interface\s+(.+)/);
      if (directiveMatch) {
        const directiveContent = directiveMatch[1].trim();
        const directive = this.parseDirectiveContent(directiveContent);
        
        if (!this.directives.has(index)) {
          this.directives.set(index, []);
        }
        this.directives.get(index)!.push(directive);
        
        // Store directives by type for easy access
        this.storeDirective(directive);
      }
    });
  }

  private parseDirectiveContent(content: string): InterfaceDirective {
    const buildMatch = content.match(/^build\s+(.+)$/);
    if (buildMatch) {
      this.buildPath = buildMatch[1];
      return { type: 'build', content: buildMatch[1] };
    }

    const copyrightMatch = content.match(/^copyright\s+"([^"]+)"$/);
    if (copyrightMatch) {
      return { type: 'copyright', content: copyrightMatch[1] };
    }

    const importMatch = content.match(/^import\s+"([^"]+)"(?:\s*;)?$/);
    if (importMatch) {
      return { type: 'import', content: importMatch[1] };
    }

    const replaceMatch = content.match(/^replace\s+(\w+)\s+with\s+(\w+)$/);
    if (replaceMatch) {
      return { type: 'replace', content: `${replaceMatch[1]} with ${replaceMatch[2]}` };
    }

    const removeMatch = content.match(/^remove\s+(.+)$/);
    if (removeMatch) {
      return { type: 'remove', content: removeMatch[1] };
    }

    const excludeMatch = content.match(/^exclude\s+(.+)$/);
    if (excludeMatch) {
      return { type: 'exclude', content: excludeMatch[1] };
    }

    const includeMatch = content.match(/^include\s+(.+)$/);
    if (includeMatch) {
      return { type: 'include', content: includeMatch[1] };
    }

    const getterMatch = content.match(/^getter\s+(.+)$/);
    if (getterMatch) {
      return { type: 'getter', content: getterMatch[1] };
    }

    const isMatch = content.match(/^is\s+(.+)$/);
    if (isMatch) {
      return { type: 'is', content: isMatch[1] };
    }

    return { type: 'build', content: content };
  }

  private storeDirective(directive: InterfaceDirective): void {
    switch (directive.type) {
      case 'copyright':
        this.copyrightNotice = directive.content;
        break;
      case 'import':
        this.importDirectives.push(directive.content);
        break;
      case 'replace':
        const replaceMatch = directive.content.match(/^(\w+)\s+with\s+(\w+)$/);
        if (replaceMatch) {
          this.replaceDirectives.set(replaceMatch[1], replaceMatch[2]);
        }
        break;
      case 'remove':
        directive.content.split(/\s+/).forEach(item => this.removeDirectives.add(item));
        break;
      case 'exclude':
        directive.content.split(/\s+/).forEach(item => this.excludeDirectives.add(item));
        break;
      case 'include':
        directive.content.split(/\s+/).forEach(item => this.includeDirectives.add(item));
        break;
      case 'getter':
        directive.content.split(/\s+/).forEach(item => this.getterDirectives.add(item));
        break;
      case 'is':
        directive.content.split(/\s*,\s*/).forEach(item => this.isDirectives.push(item.trim()));
        break;
    }
  }

  private extractNatspecForLine(lineNumber: number): string {
    let natspec: string[] = [];
    let currentLine = lineNumber - 2; // Start one line before the target
    let inBlockComment = false;
    
    // Look backwards for natspec comments
    while (currentLine >= 0) {
      const line = this.lines[currentLine].trim();
      
      // Skip interface directives
      if (line.startsWith('/// !interface')) {
        currentLine--;
        continue;
      }
      
      // Handle end of block comment
      if (line.includes('*/')) {
        inBlockComment = true;
        natspec.unshift(line);
        currentLine--;
        continue;
      }
      
      // Handle middle and start of block comment
      if (inBlockComment) {
        if (line.startsWith('*') || line.startsWith('/**')) {
          natspec.unshift(line);
          // If we hit the start of a block comment, we're done with this block
          if (line.startsWith('/**')) {
            break;
          }
        } else if (line === '') {
          // Skip empty lines within block comments
          natspec.unshift(line);
        } else {
          // If we hit non-comment content while in a block, we've gone too far
          break;
        }
        currentLine--;
        continue;
      }
      
      // Handle single-line natspec comments
      if (line.startsWith('/// ')) {
        natspec.unshift(line);
        currentLine--;
        continue;
      }
      
      // Skip empty lines and regular comments
      if (line === '' || (line.startsWith('//') && !line.startsWith('///'))) {
        currentLine--;
        continue;
      }
      
      // Stop when we reach non-comment code
      break;
    }
    
    return natspec.join('\n').trim();
  }

  private parseContract(): ParsedContract {
    const contractMatch = this.content.match(/(?:abstract\s+)?contract\s+(\w+)(?:\s+is\s+([^{]+))?\s*\{/);
    if (!contractMatch) {
      throw new Error('Contract declaration not found');
    }

    const contractName = contractMatch[1];
    const inheritance = contractMatch[2] || '';
    
    // Find the line number of the contract declaration
    const contractLineIndex = this.lines.findIndex(line => 
      line.includes(`contract ${contractName}`)
    );
    
    const natspec = this.extractNatspecForLine(contractLineIndex);

    return {
      name: contractName,
      natspec,
      inheritance
    };
  }

  private parseFunctions(): ParsedFunction[] {
    // Split content into lines and process each function declaration more carefully
    const functions: ParsedFunction[] = [];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i].trim();
      if (line.startsWith('function ')) {
        const func = this.parseFunction(this.lines, i);
        if (func) {
          functions.push(func);
        }
      }
    }
    
    return functions;
  }

  private parseFunction(lines: string[], startIndex: number): ParsedFunction | null {
    // Collect the full function declaration across multiple lines
    let funcDeclaration = '';
    let braceCount = 0;
    let foundOpenBrace = false;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      funcDeclaration += ' ' + line;
      
      // Count braces to find the function body start
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundOpenBrace = true;
          break;
        } else if (char === '}') {
          braceCount--;
        }
      }
      
      if (foundOpenBrace && braceCount > 0) {
        break;
      }
    }
    
    // Parse the complete function declaration
    const funcMatch = funcDeclaration.match(
      /function\s+(\w+)\s*\(([^)]*)\)\s*(external|public|internal|private)?\s*(view|pure|payable)?\s*[\w\s,()]*?(?:returns\s*\(([^)]*)\))?\s*\{/
    );
    
    if (!funcMatch) {
      return null;
    }
    
    const [, name, params, visibility = 'public', stateMutability = 'nonpayable', returnType = ''] = funcMatch;
    
    const natspec = this.extractNatspecForLine(startIndex + 1);
    
    return {
      name,
      visibility: visibility as any,
      stateMutability: stateMutability as any,
      parameters: params.trim(),
      returnType: returnType.trim(),
      modifiers: [],
      fullSignature: funcDeclaration,
      natspec,
      lineNumber: startIndex + 1
    };
  }

  private parseEvents(): ParsedEvent[] {
    const eventRegex = /event\s+(\w+)\s*\(([^)]*)\)\s*;/g;
    const events: ParsedEvent[] = [];
    let match;

    while ((match = eventRegex.exec(this.content)) !== null) {
      const [fullMatch, name, params] = match;
      
      // Find the line number by counting newlines up to the match position
      const lineNumber = this.content.substring(0, match.index).split('\n').length;
      const natspec = this.extractNatspecForLine(lineNumber);
      
      events.push({
        name,
        parameters: params,
        fullSignature: fullMatch,
        natspec,
        lineNumber
      });
    }

    return events;
  }

  private parseErrors(): ParsedError[] {
    const errorRegex = /error\s+(\w+)\s*\(([^)]*)\)\s*;/g;
    const errors: ParsedError[] = [];
    let match;

    while ((match = errorRegex.exec(this.content)) !== null) {
      const [fullMatch, name, params] = match;
      
      // Find the line number by counting newlines up to the match position
      const lineNumber = this.content.substring(0, match.index).split('\n').length;
      const natspec = this.extractNatspecForLine(lineNumber);
      
      errors.push({
        name,
        parameters: params,
        fullSignature: fullMatch,
        natspec,
        lineNumber
      });
    }

    return errors;
  }

  private parseVariables(): ParsedVariable[] {
    const variableRegex = /(uint256|string|address|bool|bytes32|mapping\([^)]+\))\s+(public|internal|private)?\s*(constant)?\s+(\w+)/g;
    const variables: ParsedVariable[] = [];
    let match;

    while ((match = variableRegex.exec(this.content)) !== null) {
      const [fullMatch, type, visibility = 'internal', constant, name] = match;
      
      // Skip if this is part of a function parameter or other context
      const lineStart = this.content.lastIndexOf('\n', match.index) + 1;
      const lineEnd = this.content.indexOf('\n', match.index);
      const line = this.content.substring(lineStart, lineEnd);
      
      // Only include if it's a proper variable declaration (not in function params)
      if (line.trim().includes('function') || line.trim().includes('(')) {
        continue;
      }
      
      // Find the line number by counting newlines up to the match position
      const lineNumber = this.content.substring(0, match.index).split('\n').length;
      const natspec = this.extractNatspecForLine(lineNumber);
      
      variables.push({
        name,
        type,
        visibility: visibility as any,
        isConstant: !!constant,
        fullSignature: fullMatch,
        natspec,
        lineNumber
      });
    }

    return variables;
  }

  private shouldIncludeFunction(func: ParsedFunction): boolean {
    // Force include if in include directives
    if (this.includeDirectives.has(func.name)) return true;
    
    // Exclude if in exclude directives
    if (this.excludeDirectives.has(func.name)) return false;
    
    // Only include external and public functions by default
    return func.visibility === 'external' || func.visibility === 'public';
  }

  private shouldIncludeEvent(event: ParsedEvent): boolean {
    return !this.excludeDirectives.has(event.name);
  }

  private shouldIncludeError(error: ParsedError): boolean {
    return !this.excludeDirectives.has(error.name);
  }

  private formatNatspec(natspec: string, indent: string = ''): string {
    if (!natspec) return '';
    
    return natspec
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `${indent}${line}`)
      .join('\n');
  }

  private generateGetterFunctions(variables: ParsedVariable[]): string[] {
    const getters: string[] = [];
    
    variables.forEach(variable => {
      if (this.getterDirectives.has(variable.name) || 
          (variable.visibility === 'public' && !this.excludeDirectives.has(variable.name))) {
        
        let getter = '';
        if (variable.natspec) {
          getter += this.formatNatspec(variable.natspec, '    ') + '\n';
        }
        
        if (variable.type.startsWith('mapping')) {
          // Handle mapping getters - simplified for now
          const mappingMatch = variable.type.match(/mapping\((.+?)\s*=>\s*(.+?)\)/);
          if (mappingMatch) {
            const [, keyType, valueType] = mappingMatch;
            getter += `    function ${variable.name}(${keyType} key) external view returns (${valueType});`;
          }
        } else {
          getter += `    function ${variable.name}() external view returns (${variable.type});`;
        }
        
        getters.push(getter);
      }
    });

    return getters;
  }

  public generateInterface(): string {
    if (!this.buildPath) {
      throw new Error('No build directive found. Use /// !interface build <path>');
    }

    const functions = this.parseFunctions();
    const events = this.parseEvents();
    const errors = this.parseErrors();
    const variables = this.parseVariables();
    const contract = this.parseContract();

    let output = '// SPDX-License-Identifier: MIT\n';
    output += 'pragma solidity ^0.8.20;\n\n';

    // Add copyright notice if provided
    if (this.copyrightNotice) {
      output += `// ${this.copyrightNotice}\n\n`;
    }

    // Add imports
    this.importDirectives.forEach(importPath => {
      output += `import "${importPath}";\n`;
    });
    
    if (this.importDirectives.length > 0) {
      output += '\n';
    }

    const interfaceName = `I${contract.name}`;

    // Process inheritance
    let interfaceInheritance = '';
    const allInheritedInterfaces: string[] = [];
    
    // Process original contract inheritance
    if (contract.inheritance) {
      const inheritanceList = contract.inheritance.split(',').map(s => s.trim());
      const processedInheritance = inheritanceList
        .filter(contract => !this.removeDirectives.has(contract))
        .map(contract => this.replaceDirectives.get(contract) || contract);
      
      allInheritedInterfaces.push(...processedInheritance);
    }
    
    // Add interfaces from 'is' directives
    allInheritedInterfaces.push(...this.isDirectives);
    
    if (allInheritedInterfaces.length > 0) {
      interfaceInheritance = ` is ${allInheritedInterfaces.join(', ')}`;
    }

    // Add contract natspec
    if (contract.natspec) {
      output += this.formatNatspec(contract.natspec) + '\n';
    }

    output += `interface ${interfaceName}${interfaceInheritance} {\n\n`;

    // Add events
    const includedEvents = events.filter(event => this.shouldIncludeEvent(event));
    if (includedEvents.length > 0) {
      includedEvents.forEach(event => {
        if (event.natspec) {
          output += this.formatNatspec(event.natspec, '    ') + '\n';
        }
        output += `    event ${event.name}(${event.parameters});\n`;
      });
      output += '\n';
    }

    // Add errors
    const includedErrors = errors.filter(error => this.shouldIncludeError(error));
    if (includedErrors.length > 0) {
      includedErrors.forEach(error => {
        if (error.natspec) {
          output += this.formatNatspec(error.natspec, '    ') + '\n';
        }
        output += `    error ${error.name}(${error.parameters});\n`;
      });
      output += '\n';
    }

    // Add getter functions for variables
    const getterFunctions = this.generateGetterFunctions(variables);
    if (getterFunctions.length > 0) {
      getterFunctions.forEach(getter => {
        output += `${getter}\n`;
      });
      output += '\n';
    }

    // Add functions
    const includedFunctions = functions.filter(func => this.shouldIncludeFunction(func));
    includedFunctions.forEach(func => {
      const visibility = 'external'; // All interface functions are external
      const stateMutability = func.stateMutability !== 'nonpayable' ? ` ${func.stateMutability}` : '';
      const returnType = func.returnType ? ` returns (${func.returnType})` : '';
      
      if (func.natspec) {
        output += this.formatNatspec(func.natspec, '    ') + '\n';
      }
      output += `    function ${func.name}(${func.parameters}) ${visibility}${stateMutability}${returnType};\n`;
    });

    output += '}\n';

    return output;
  }

  public writeInterface(): 'generated' | 'skipped' {
    // Handle relative paths - resolve relative to the contract file's directory
    let outputPath: string;
    if (path.isAbsolute(this.buildPath)) {
      outputPath = this.buildPath;
    } else {
      const contractDir = path.dirname(this.contractPath);
      outputPath = path.resolve(contractDir, this.buildPath);
    }
    
    // Check if file needs to be regenerated
    if (!this.force && fs.existsSync(outputPath)) {
      const contractStat = fs.statSync(this.contractPath);
      const interfaceStat = fs.statSync(outputPath);
      
      if (interfaceStat.mtime > contractStat.mtime) {
        console.log(`⏭️  Skipping ${outputPath} (up to date, use --force to regenerate)`);
        return 'skipped';
      }
    }

    const interfaceContent = this.generateInterface();
    
    // Create directory if it doesn't exist
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, interfaceContent);
    console.log(`Interface generated: ${outputPath}`);
    return 'generated';
  }
}

// Find all contracts with build directives
export async function findContractsWithBuildDirectives(directory: string = './contracts'): Promise<string[]> {
  const contractFiles: string[] = [];
  
  function findSolFiles(dir: string): void {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findSolFiles(fullPath);
      } else if (item.endsWith('.sol')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('/// !interface build')) {
          contractFiles.push(fullPath);
        }
      }
    }
  }
  
  findSolFiles(directory);
  return contractFiles;
}

// Build all contracts with interface directives
export async function buildAllInterfaces(force: boolean = false): Promise<void> {
  console.log('🔍 Searching for contracts with build directives...');
  
  const contractFiles = await findContractsWithBuildDirectives();
  
  if (contractFiles.length === 0) {
    console.log('❌ No contracts found with build directives.');
    console.log('   Add /// !interface build <path> to contracts you want to generate interfaces for.');
    return;
  }
  
  console.log(`📄 Found ${contractFiles.length} contract(s) with build directives:`);
  contractFiles.forEach(file => console.log(`   - ${file}`));
  console.log();
  
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  for (const contractFile of contractFiles) {
    try {
      console.log(`🔨 Building interface for: ${contractFile}`);
      const generator = new InterfaceGenerator(contractFile, force);
      const result = generator.writeInterface();
      
      if (result === 'generated') {
        successCount++;
      } else if (result === 'skipped') {
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ Error building interface for ${contractFile}:`, error);
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
}

// Main execution
export async function buildInterface(contractPath: string, force: boolean = false): Promise<void> {
  try {
    const generator = new InterfaceGenerator(contractPath, force);
    generator.writeInterface();
  } catch (error) {
    console.error('Error building interface:', error);
    process.exit(1);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const forceFlag = args.includes('--force');
  const filteredArgs = args.filter(arg => arg !== '--force');
  const arg = filteredArgs[0];
  
  if (!arg) {
    console.error('Usage:');
    console.error('  npx ts-node src/buildInterface.ts <contract-path> [--force]  # Build single contract');
    console.error('  npx ts-node src/buildInterface.ts all [--force]             # Build all contracts with directives');
    console.error('');
    console.error('Options:');
    console.error('  --force    Force regeneration of interface files even if they are up to date');
    process.exit(1);
  }
  
  if (arg === 'all') {
    buildAllInterfaces(forceFlag).catch(error => {
      console.error('Error in batch build:', error);
      process.exit(1);
    });
  } else {
    buildInterface(arg, forceFlag).catch(error => {
      console.error('Error building interface:', error);
      process.exit(1);
    });
  }
} 