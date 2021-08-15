import { IncomingMessage } from "http";

/**
 * Exists to check whether code after a statement is reachable.
 * If a call to this function is unreachable, TypeScript will not compile.
 */
export function noOp() {}

// functions to test whether the argument has type any.
// The statements after the call will be unreachable, if the given argument is any.

export function incomingMessageNotAny(a: IncomingMessage): void;
export function incomingMessageNotAny(a: any): never;
export function incomingMessageNotAny(a: unknown): void {};

export function numberNotAny(a: number): void;
export function numberNotAny(a: any): never;
export function numberNotAny(a: unknown): void {};

export function objectNotAny(a: object): void;
export function objectNotAny(a: any): never;
export function objectNotAny(a: unknown): void {};

export function stringNotAny(a: string): void;
export function stringNotAny(a: any): never;
export function stringNotAny(a: unknown): void {};
