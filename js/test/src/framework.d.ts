import { MiddlewareSpec, Middleware } from "../../src/types";
import { Quelaag } from "../../src";
export interface Test {
    readonly name: string;
    readonly run: (examiner: Examiner) => void;
    readonly cases?: number;
}
export interface Examiner {
    readonly fail: (reason?: any) => void;
    readonly pass: () => void;
    readonly test: (result: boolean, message?: string) => void;
}
export declare function makeRequest<M extends MiddlewareSpec, I extends Middleware<M>>(handler: Quelaag<M, I>, path?: string): Promise<void>;
export declare function rejectAfter(afterMilliseconds: number): Promise<void>;
export declare function run(testcase: Test): Promise<void>;
