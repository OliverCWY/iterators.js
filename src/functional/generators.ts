import { Iterator, Option, Generator } from "..";
import { chainFromIterable, range } from "./static_generators";

export function* enumerate<T>(iter: Iterator<T>): Generator<[number, T]> {
    let i = 0;
    for(const item of iter) {
        yield [i, item];
        i++;
    }
}

export const entries = enumerate;

export function* fill<T>(iter: Iterator<any>, value: T): Generator<T> {
    for(const _ of iter) yield value;
}

export function* filter<T>(iter: Iterator<T>, filterFn: (item: T, idx: number) => boolean): Generator<T> {
    for(const [i, item] of enumerate(iter)) {
        if (filterFn(item, i)) yield item;
    }
}

export function* filterMap<T, U>(iter: Iterator<T>, filterMapFn: (item: T, idx: number) => Option<U>): Generator<U> {
    for(const [i, item] of enumerate(iter)) {
        const mapItem = filterMapFn(item, i);
        if (mapItem.isSome()) yield mapItem.valueUnchecked;
    }
}

export function* flatten<T>(iterOfIter: Iterator<Iterator<T>>): Generator<T> {
    for(const iter of iterOfIter) {
        yield* iter
    }
}

export function flatMap<T, U>(iter: Iterator<T>, mapFn: (item: T, idx: number) => Iterator<U>): Generator<U> {
    return flatten(map(iter, mapFn))
}

export function* map<T, U>(iter: Iterator<T>, mapFn: (item: T, idx: number) => U): Generator<U> {
    for(const [i, item] of enumerate(iter)) {
        yield mapFn(item, i);
    }
}

export function mapWhile<T, U>(iter: Iterator<T>, predicate: (item: T, idx: number) => Option<U>): Generator<U> {
    return (
        map(
            filter(
                map(
                iter,
                predicate
            ),
                item => item.isSome()
            ),
            item => item.valueUnchecked
        )
    )
}

export function zip<T1>(iter1: Iterator<T1>): Generator<[T1]>;
export function zip<T1, T2>(iter1: Iterator<T1>, iter2: Iterator<T2>): Generator<[T1, T2]>;
export function zip<T1, T2, T3>(iter1: Iterator<T1>, iter2: Iterator<T2>, iter3: Iterator<T3>): Generator<[T1, T2, T3]>;
export function zip<T1, T2, T3, T4>(iter1: Iterator<T1>, iter2: Iterator<T2>, iter3: Iterator<T3>, iter4: Iterator<T4>): Generator<[T1, T2, T3, T4]>;

export function* zip<T>(...iters: Iterator<T>[]): Generator<T[]> {
    const _iters = iters.map(iter => iter[Symbol.iterator]());
    while(1) {
        const zipItem: T[] = [];
        for(const iter of _iters) {
            const result = iter.next();
            if(result.done) return;
            zipItem.push(result.value);
        }
        yield zipItem;
    }
}

export function* cycle<T>(iter: Iterator<T>): Generator<T> {
    const all: T[] = [];
    for(const item of iter) {
        all.push(item);
        yield item;
    }
    while(1) {
        for(const item of all) {
            yield item;
        }
    }
}

export function* accumulate<T extends string | number>(iter: Iterator<T>): Generator<T> {
    let accumulator: T | undefined = undefined;
    for(const item of iter) {
        if (accumulator == undefined) {
            accumulator = item;
        } else {
            //@ts-ignore
            accumulator += item;
        }
        yield accumulator;
    }
}

export const scan = accumulate;

export function* batched<T>(iter: Iterator<T>, n: number): Generator<T[]> {
    let cache = [];
    for(const item of iter) {
        cache.push(item);
        if (cache.length >= n) {
            yield cache;
            cache = []
        }
    }
    if (cache.length > 0) yield cache;
}

export function chain<T>(...iters: Iterator<T>[]): Generator<T> {
    return chainFromIterable(iters);
}

export const concat = chain;

export function* compress<T>(iter: Iterator<T>, selector: Iterator<boolean>) {
    return map(filter(zip(iter, selector), ([_, selected]) => selected), (item) => item)
}

export function* dropWhile<T>(iter: Iterator<T>, predicate: (item: T, idx: number) => boolean): Generator<T> {
    let dropping = true;
    for(const [i, item] of enumerate(iter)) {
        if(dropping) {
            if (!predicate(item, i)) {
                dropping = false;
                yield item;
            }
        } else {
            yield item;
        }
    }
}

export function* islice<T>(iter: Iterator<T>, start: number, end?: number, step: number = 1): Generator<T> {
    if (end == undefined) {
        end = start;
        start = 0;
    }
    if (step < 0) {
        throw "Step should be positive";
    }
    let next = start;
    for(const [i, item] of enumerate(iter)) {
        if (next == i) {
            yield item;
            next += step;
        }
    }
}

export function inspect<T>(iter: Iterator<T>, fn: (item: T, idx: number) => void): Generator<T> {
    return map(
        iter,
        (item, idx) => {
            fn(item, idx);
            return item;
        }
    )
}

export function* pairwise<T>(iter: Iterator<T>): Generator<[T, T]> {
    const _iter = iter[Symbol.iterator]();
    const _first = _iter.next();
    if (_first.done) {
        return;
    }
    let prev = _first.value;
    for(const item of _iter) {
        yield [prev, item];
        prev = item;
    }
}

export function* product<T>(...iters: Iterator<T>[]): Generator<T[]> {
    const iter = iters.shift();
    if (iter == undefined) return;
    const _iter = iter[Symbol.iterator]();
    const _first = _iter.next();
    if(_first.done) return;
    const first = _first.value;
    let yielded: T[][] = [];
    for(const subResult of product(...iters)) {
        yield [first, ...subResult];
        yielded.push(subResult);
    }
    for(const item of _iter) {
        for(const subResult of yielded) {
            yield [item, ...subResult];
        }
    }
}

export function* skip<T>(iter: Iterator<T>, count: number): Generator<T> {
    const _iter = iter[Symbol.iterator]();
    for(const _ in range(count)) {
        if (_iter.next().done) return;
    }
    yield* _iter;
}

export function* skipWhile<T>(iter: Iterator<T>, predicate: (item: T, idx: number) => boolean): Generator<T> {
    const _iter = iter[Symbol.iterator]();
    let idx = 0;
    while(true){
        const item = _iter.next();
        if (item.done) return;
        if (!predicate(item.value, idx)) break;
        idx++;
    }
    yield* iter;
}

export function* stepBy<T>(iter: Iterator<T>, step: number): Generator<T> {
    let counter = step;
    for(const item of iter) {
        if(counter == step) {
            yield item;
            counter = 0;
        }
        counter++;
    }
}

export function* take<T>(iter: Iterator<T>, count: number): Generator<T> {
    const _iter = iter[Symbol.iterator]();
    for(const _ in range(count)) {
        const item = _iter.next();
        if (item.done) return;
        yield item.value;
    }
}

export function* takeWhile<T>(iter: Iterator<T>, predicate: (item: T, idx: number) => boolean): Generator<T> {
    const _iter = iter[Symbol.iterator]();
    let idx = 0;
    while(true){
        const item = _iter.next();
        if (item.done || !predicate(item.value, idx)) return;
        yield item.value;
        idx++;
    }
}