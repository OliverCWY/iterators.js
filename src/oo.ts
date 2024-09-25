import { Iterator } from ".";
import * as accumulators from "./functional/accumulators";
import * as generators from "./functional/generators";
import * as staticGenerators from "./functional/static_generators";

export class Iter<T> implements IterableIterator<T> {
    private inner: IterableIterator<T>
    private consumed = false;

    [Symbol.iterator] = () => this.inner;

    constructor(from: Iterator<T>) {
        this.inner = from[Symbol.iterator]();
    }

    next() {
        return this.inner.next();
    }

    consume() {
        if (this.consumed) throw new Error("Iterator already consumed!");
        this.consumed = true;
    }
}

// export interface Iter<T> extends Gen<T>, Accum<T> {}

declare global {
    interface Array<T> {
        iter: (arr: Array<T>) => Iter<T>
    }
}

Array.prototype.iter = function () {
    return new Iter(this);
};