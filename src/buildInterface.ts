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
  type: 'build' | 'import' | 'replace' | 'remove' | 'exclude' | 'include' | 'getter' | 'copyright' | 'is' | 'module';
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

export class InterfaceGenerator {
  private content: string;
  private lines: string[];
  private directives: Map<number, InterfaceDirective[]> = new Map();
  public buildPath: string = '';
  private contractPath: string;
  private importDirectives: string[] = [];
  public replaceDirectives: Map<string, string> = new Map();
  public removeDirectives: Set<string> = new Set();
  private excludeDirectives: Set<string> = new Set();
  private includeDirectives: Set<string> = new Set();
  private getterDirectives: Set<string> = new Set();
  private copyrightNotice: string = '';
  public isDirectives: string[] = [];
  private moduleDirectives: Array<{from: string, to: string, flags: string}> = [];
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
      const directiveMatch = line.match(/\/\/\/ @custom:interface\s+(.+)/);
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
    // Handle build directive with optional quotes
    const buildMatch = content.match(/^build\s+(?:"([^"]+)"|(\S+))$/);
    if (buildMatch) {
      const buildPath = buildMatch[1] || buildMatch[2]; // Quoted or unquoted path
      this.buildPath = buildPath;
      return { type: 'build', content: buildPath };
    }

    // Handle module directive with from "..." to "..." syntax and optional flags
    const moduleMatch = content.match(/^module\s+"([^"]+)"\s+to\s+"([^"]+)"(.*)$/);
    if (moduleMatch) {
      const from = moduleMatch[1];
      const to = moduleMatch[2];
      const flags = moduleMatch[3].trim(); // Everything after the 'to' clause
      return { type: 'module', content: `${from} to ${to}${flags ? ' ' + flags : ''}` };
    }

    const copyrightMatch = content.match(/^copyright\s+"([^"]+)"$/);
    if (copyrightMatch) {
      return { type: 'copyright', content: copyrightMatch[1] };
    }

    // Handle import directive with optional quotes
    const importMatch = content.match(/^import\s+(?:"([^"]+)"|(\S+))(?:\s*;)?$/);
    if (importMatch) {
      const importPath = importMatch[1] || importMatch[2]; // Quoted or unquoted path
      return { type: 'import', content: importPath };
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
      case 'module':
        // Handle module directive - content is "from to to flags"
        const moduleMatch = directive.content.match(/^(.+?)\s+to\s+(.+?)(\s+.+)?$/);
        if (moduleMatch) {
          const from = moduleMatch[1];
          const to = moduleMatch[2];
          const flags = moduleMatch[3] ? moduleMatch[3].trim() : '';
          this.moduleDirectives.push({from, to, flags});
        }
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
      if (line.startsWith('/// @custom:interface')) {
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
    // Enhanced regex to support all uint types, int types, and immutable/constant keywords
    const variableRegex = /(uint\d*|int\d*|string|address|bool|bytes\d*|mapping\([^)]+\))\s+(public|internal|private)?\s*(constant|immutable)?\s*(\w+)\s*(?:=|;)/g;
    const variables: ParsedVariable[] = [];
    let match;

    while ((match = variableRegex.exec(this.content)) !== null) {
      const [fullMatch, type, visibility = 'internal', modifier, name] = match;
      
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
        isConstant: modifier === 'constant' || modifier === 'immutable',
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
      // Include getter if:
      // 1. Explicitly requested via getter directive, OR
      // 2. Variable is public (automatic getter in Solidity)
      if (this.getterDirectives.has(variable.name) || 
          (variable.visibility === 'public' && !this.excludeDirectives.has(variable.name))) {
        
        let getter = '';
        if (variable.natspec) {
          getter += this.formatNatspec(variable.natspec, '    ') + '\n';
        }
        
        // Determine state mutability for getter
        const stateMutability = variable.isConstant ? ' pure' : ' view';
        
        if (variable.type.startsWith('mapping')) {
          // Handle mapping getters - simplified for now
          const mappingMatch = variable.type.match(/mapping\((.+?)\s*=>\s*(.+?)\)/);
          if (mappingMatch) {
            const [, keyType, valueType] = mappingMatch;
            getter += `    function ${variable.name}(${keyType} key) external${stateMutability} returns (${valueType});`;
          }
        } else {
          getter += `    function ${variable.name}() external${stateMutability} returns (${variable.type});`;
        }
        
        getters.push(getter);
      }
    });

    return getters;
  }

  public generateInterface(): string {
    if (!this.buildPath) {
      throw new Error('No build directive found. Use /// @custom:interface build <path>');
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
        // Apply type replacements to event parameters
        const processedParameters = this.applyTypeReplacements(event.parameters);
        output += `    event ${event.name}(${processedParameters});\n`;
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
        // Apply type replacements to error parameters
        const processedParameters = this.applyTypeReplacements(error.parameters);
        output += `    error ${error.name}(${processedParameters});\n`;
      });
      output += '\n';
    }

    // Add getter functions for variables
    const getterFunctions = this.generateGetterFunctions(variables);
    if (getterFunctions.length > 0) {
      getterFunctions.forEach(getter => {
        // Apply type replacements to getter functions
        const processedGetter = this.applyTypeReplacements(getter);
        output += `${processedGetter}\n`;
      });
      output += '\n';
    }

    // Add functions
    const includedFunctions = functions.filter(func => this.shouldIncludeFunction(func));
    includedFunctions.forEach(func => {
      const visibility = 'external'; // All interface functions are external
      const stateMutability = func.stateMutability !== 'nonpayable' ? ` ${func.stateMutability}` : '';
      
      // Apply type replacements to parameters and return type
      const processedParameters = this.applyTypeReplacements(func.parameters);
      const processedReturnType = func.returnType ? this.applyTypeReplacements(func.returnType) : '';
      const returnType = processedReturnType ? ` returns (${processedReturnType})` : '';
      
      if (func.natspec) {
        output += this.formatNatspec(func.natspec, '    ') + '\n';
      }
      output += `    function ${func.name}(${processedParameters}) ${visibility}${stateMutability}${returnType};\n`;
    });

    output += '}\n';

    return output;
  }

  private applyTypeReplacements(text: string): string {
    if (!text || this.replaceDirectives.size === 0) {
      return text;
    }

    let result = text;
    
    this.replaceDirectives.forEach((replacement, original) => {
      // Simple exact match for return types (most common case)
      if (result === original) {
        result = replacement;
        return;
      }
      
      // Clean regex: start with (|,|space, end with space|,|)|[
      result = result.replace(
        new RegExp(`([\\(,\\s])${original}([\\s,\\)\\[])`, 'g'),
        `$1${replacement}$2`
      );
    });

    return result;
  }

  public writeInterface(): 'generated' | 'skipped' {
    // First, process any module directives to generate interfaces from external contracts
    for (const moduleDirective of this.moduleDirectives) {
      try {
        this.processModuleDirective(moduleDirective);
      } catch (error) {
        console.error(`❌ Error processing module directive ${moduleDirective.from} -> ${moduleDirective.to}:`, error);
      }
    }

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

  private processModuleDirective(moduleDirective: {from: string, to: string, flags: string}): void {
    const { from: modulePath, to: outputPath, flags } = moduleDirective;
    
    // Parse flags
    const moduleFlags = this.parseModuleFlags(flags);
    
    // Resolve the module path
    let resolvedModulePath: string;
    
    if (modulePath.startsWith('@') || modulePath.startsWith('.')) {
      // Handle npm packages or relative paths
      try {
        if (modulePath.startsWith('@')) {
          // For npm packages, try to resolve through node_modules
          const packagePath = path.join(process.cwd(), 'node_modules', modulePath);
          if (fs.existsSync(packagePath)) {
            resolvedModulePath = packagePath;
          } else {
            throw new Error(`Package not found: ${modulePath}`);
          }
        } else {
          // For relative paths, resolve relative to the current contract
          const contractDir = path.dirname(this.contractPath);
          resolvedModulePath = path.resolve(contractDir, modulePath);
        }
      } catch (error) {
        throw new Error(`Could not resolve module path: ${modulePath}`);
      }
    } else {
      // Absolute path
      resolvedModulePath = modulePath;
    }

    if (!fs.existsSync(resolvedModulePath)) {
      throw new Error(`Module file not found: ${resolvedModulePath}`);
    }

    // Read the external contract
    const externalContent = fs.readFileSync(resolvedModulePath, 'utf8');
    
    // Create a temporary InterfaceGenerator for the external contract
    const tempGenerator = new InterfaceGenerator(resolvedModulePath, this.force);
    
    // Apply module-specific flags to the temporary generator
    this.applyModuleFlags(tempGenerator, moduleFlags);
    
    // Override the build path for the temporary generator
    tempGenerator.buildPath = outputPath;
    
    // Generate the interface content
    const interfaceContent = tempGenerator.generateInterface();
    
    // Resolve output path relative to current contract
    let resolvedOutputPath: string;
    if (path.isAbsolute(outputPath)) {
      resolvedOutputPath = outputPath;
    } else {
      const contractDir = path.dirname(this.contractPath);
      resolvedOutputPath = path.resolve(contractDir, outputPath);
    }
    
    // Create directory if it doesn't exist
    const outputDir = path.dirname(resolvedOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the interface file
    fs.writeFileSync(resolvedOutputPath, interfaceContent);
    console.log(`📦 Module interface generated: ${modulePath} -> ${resolvedOutputPath}`);
  }

  private parseModuleFlags(flags: string): {remove: string[], replace: Map<string, string>, is: string[], import: string[]} {
    const result = {
      remove: [] as string[],
      replace: new Map<string, string>(),
      is: [] as string[],
      import: [] as string[]
    };

    if (!flags) return result;

    // Parse --remove flags
    const removeMatches = flags.match(/--remove\s+(\w+)(?:\s|$)/g);
    if (removeMatches) {
      removeMatches.forEach(match => {
        const removeMatch = match.match(/--remove\s+(\w+)/);
        if (removeMatch) {
          result.remove.push(removeMatch[1]);
        }
      });
    }

    // Parse --replace flags
    const replaceMatches = flags.match(/--replace\s+(\w+)\s+with\s+(\w+)(?:\s|$)/g);
    if (replaceMatches) {
      replaceMatches.forEach(match => {
        const replaceMatch = match.match(/--replace\s+(\w+)\s+with\s+(\w+)/);
        if (replaceMatch) {
          result.replace.set(replaceMatch[1], replaceMatch[2]);
        }
      });
    }

    // Parse --is flags
    const isMatches = flags.match(/--is\s+([^-]+)(?:--|$)/);
    if (isMatches) {
      const isContent = isMatches[1].trim();
      result.is = isContent.split(/\s*,\s*/).map(s => s.trim()).filter(s => s);
    }

    // Parse --import flags (support quoted or unquoted paths)
    const importMatches = flags.match(/--import\s+(?:"([^"]+)"|(\S+))(?:\s|$)/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const importMatch = match.match(/--import\s+(?:"([^"]+)"|(\S+))/);
        if (importMatch) {
          const importPath = importMatch[1] || importMatch[2];
          result.import.push(importPath);
        }
      });
    }

    return result;
  }

  private applyModuleFlags(generator: InterfaceGenerator, moduleFlags: {remove: string[], replace: Map<string, string>, is: string[], import: string[]}): void {
    // Apply remove flags
    moduleFlags.remove.forEach(item => {
      generator.removeDirectives.add(item);
    });

    // Apply replace flags
    moduleFlags.replace.forEach((replacement, original) => {
      generator.replaceDirectives.set(original, replacement);
    });

    // Apply is flags
    moduleFlags.is.forEach(item => {
      generator.isDirectives.push(item);
    });

    // Apply import flags
    moduleFlags.import.forEach(imp => {
      if (!generator.importDirectives.includes(imp)) {
        generator.importDirectives.push(imp);
      }
    });
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
        if (content.includes('/// @custom:interface build')) {
          contractFiles.push(fullPath);
        }
      }
    }
  }
  
  findSolFiles(directory);
  return contractFiles;
}

// Count total interfaces that will be generated (including modules)
function countTotalInterfaces(contractFiles: string[]): number {
  let totalInterfaces = contractFiles.length; // Start with build directives count
  
  // Add module directives count
  contractFiles.forEach(contractFile => {
    const content = fs.readFileSync(contractFile, 'utf8');
    const moduleMatches = content.match(/\/\/\/ @custom:interface module .+/g);
    if (moduleMatches) {
      totalInterfaces += moduleMatches.length;
    }
  });
  
  return totalInterfaces;
}

// Build all contracts with interface directives
export async function buildAllInterfaces(force: boolean = false): Promise<void> {
  console.log('🔍 Searching for contracts with build directives...');
  
  const contractFiles = await findContractsWithBuildDirectives();
  
  if (contractFiles.length === 0) {
    console.log('❌ No contracts found with build directives.');
    console.log('   Add /// @custom:interface build <path> to contracts you want to generate interfaces for.');
    return;
  }
  
  const totalInterfaces = countTotalInterfaces(contractFiles);
  
  console.log(`📄 Found ${contractFiles.length} contract(s) with build directives (${totalInterfaces} total interfaces including modules):`);
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
  console.log(`📊 Total: ${successCount + skippedCount + errorCount} of ${totalInterfaces} interface(s) processed`);
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