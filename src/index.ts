export type Iterator<T> = IterableIterator<T> | T[];
export type Generator<T> = globalThis.Generator<T, void, undefined>;

export class Option<T> {
    private _value: T | undefined
    private valid: boolean

    private constructor(valid: boolean, value?: T) {
        this._value = value;
        this.valid = valid;
    }

    static Some<T>(value: T) {
        return new Option(true, value);
    }

    static None<T>() {
        return new Option<T>(false);
    }

    static fromUnion<T>(value: T | undefined) {
        return new Option(value != undefined, value);
    }

    isSome() {
        return this.valid;
    }

    isNone() {
        return !this.valid;
    }

    map<U>(mapFn: (value: T) => U): Option<U> {
        if (this.valid) {
            return Some(mapFn(this._value as T));
        } else {
            return None;
        }
    }

    get value(): T | undefined {
        return this.valid ? this._value : undefined;
    }

    get valueUnchecked(): T {
        return this._value as T;
    }
}

export const Some = Option.Some;
export const None = Option.None() as Option<any>;