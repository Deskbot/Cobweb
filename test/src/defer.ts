export interface Defer<T> {
    readonly promise: Promise<T>;
    readonly resolve: (value?: T | PromiseLike<T>) => void;
    readonly reject: (reason?: any) => void;
}

export function defer<T>(): Defer<T> {
    let resolve: ((value?: T | PromiseLike<T>) => void) | undefined;
    let reject: ((reason?: any) => void) | undefined;

    const promise = new Promise<T>((r1, r2) => {
        resolve = r1;
        reject = r2;
    });

    return {
        promise,
        resolve: resolve!,
        reject: reject!,
    };
}
