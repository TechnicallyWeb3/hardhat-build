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
export interface InterfaceDirective {
    type: 'build' | 'import' | 'replace' | 'remove' | 'exclude' | 'include' | 'getter' | 'copyright' | 'is';
    content: string;
}
export interface ParsedFunction {
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
export interface ParsedEvent {
    name: string;
    parameters: string;
    fullSignature: string;
    natspec: string;
    lineNumber: number;
}
export interface ParsedError {
    name: string;
    parameters: string;
    fullSignature: string;
    natspec: string;
    lineNumber: number;
}
export interface ParsedVariable {
    name: string;
    type: string;
    visibility: 'public' | 'internal' | 'private';
    isConstant: boolean;
    fullSignature: string;
    natspec: string;
    lineNumber: number;
}
export interface ParsedContract {
    name: string;
    natspec: string;
    inheritance: string;
}
export interface BuildInterfaceOptions {
    contractPath: string;
    outputPath?: string;
    force?: boolean;
}
export interface BuildAllInterfacesOptions {
    directory?: string;
    force?: boolean;
}
export interface BuildInterfaceTaskArgs {
    contract?: string;
    all?: boolean;
}
//# sourceMappingURL=types.d.ts.map