import { Iterator, None, Option, Some } from "..";
import { enumerate } from "./generators";

export function all<T>(iter: Iterator<T>, predicate?: (item: T, idx: number) => boolean) {
    predicate = predicate || ((item) => item ? true : false);
    for(const [i, item] of enumerate(iter)) {
        if (!predicate(item, i)) return false;
    }
    return true;
}

export const every = all;

export function any<T>(iter: Iterator<T>, predicate?: (item: T, idx: number) => boolean) {
    predicate = predicate || ((item) => item ? true : false);
    for(const [i, item] of enumerate(iter)) {
        if (!predicate(item, i)) return true;
    }
    return false;
}

export enum Ordering {
    Equal = "equal", Less = "less", Greater = "greater"
}

function defaultCmpFn<T>(item1: T, item2: T): Ordering {
    if (item1 > item2) return Ordering.Greater;
    if (item1 < item2) return Ordering.Less;
    return Ordering.Equal;
}

type CmpArgs<T> = [iter1: Iterator<T>, iter2: Iterator<T>, cmpFn?: ((item1: T, item2: T, idx: number) => Ordering)];

export function cmp<T>(...[iter1, iter2, cmpFn]: CmpArgs<T>): Ordering {
    cmpFn = cmpFn || defaultCmpFn;
    const _iter1 = iter1[Symbol.iterator]();
    const _iter2 = iter2[Symbol.iterator]();
    let idx = 0;
    while (true) {
        const item1 = _iter1.next();
        const item2 = _iter2.next();
        if (item1.done) {
            if (item2.done) return Ordering.Equal;
            else return Ordering.Less;
        } 
        if (item2.done) return Ordering.Greater;
        const result = cmpFn(item1.value, item2.value, idx);
        if (result != Ordering.Equal) return result;
        idx++;
    }
}

export function eq<T>(iter1: Iterator<T>, iter2: Iterator<T>, eqFn: (item1: T, item2: T, idx: number) => boolean = (item1, item2) => item1 == item2): boolean {
    return cmp(
        iter1, iter2,
        (item1, item2, idx) => eqFn(item1, item2, idx) ? Ordering.Equal : Ordering.Less
    ) == Ordering.Equal
}

type findArgs<T> = [iter: Iterator<T>, predicate: (item: T, idx: number) => boolean];

export function findWithIdx<T>(...[iter, predicate]: findArgs<T>): Option<[number, T]> {
    for(const [i, item] of enumerate(iter)) {
        if (predicate(item, i)) return Some([i, item]);
    }
    return None;
}

export function find<T>(...args: findArgs<T>): Option<T> {
    return findWithIdx(...args).map(([_, v]) => v);
}

export function findIndex<T>(...args: findArgs<T>): Option<number> {
    return findWithIdx(...args).map(([idx]) => idx);
}

export function indexOf<T>(iter: Iterator<T>, target: T): Option<number> {
    return findIndex(iter, (value) => value == target);
}

export function findLastWithIdx<T>(...[iter, predicate]: findArgs<T>): Option<[number, T]> {
    let result = None;
    for(const [i, item] of enumerate(iter)) {
        if (predicate(item, i)) result = Some([i, item]);
    }
    return result;
}

export function findLast<T>(...args: findArgs<T>): Option<T> {
    return findLastWithIdx(...args).map(([_, v]) => v);
}

export function findLastIndex<T>(...args: findArgs<T>): Option<number> {
    return findLastWithIdx(...args).map(([idx]) => idx);
}

export function lastIndexOf<T>(iter: Iterator<T>, target: T): Option<number> {
    return findLastIndex(iter, (value) => value == target);
}

export function forEach<T>(iter: Iterator<T>, fn: (item: T, idx: number) => void) {
    for(const [i, item] of enumerate(iter)) {
        fn(item, i);
    }
}

export function join(iter: Iterator<string>, by: string): string {
    return collect(iter).join(by);
}

export function last<T>(iter: Iterator<any>): Option<T> {
    let last = None;
    for(const item of iter) {
        last = Some(item)
    }
    return last;
}

export function len(iter: Iterator<any>) {
    let count = 0;
    for(const _ of iter) {
        count++;
    }
    return count;
}

export const count = len;

export function collect<T>(iter: Iterator<T>) {
    return Array.from(iter);
}

export function max<T>(iter: Iterator<T>, isBigger: (item1: T, item2: T) => boolean = (item1, item2) => item1 > item2): Option<T> {
    iter = iter[Symbol.iterator]();
    const first = iter.next();
    if (first.done) return None;
    let max: T = first.value;
    for(const item of iter) {
        if (isBigger(item, max)) {
            max = item;
        }
    }
    return Some(max);
}

export function min<T>(iter: Iterator<T>, isSmaller: (item1: T, item2: T) => boolean = (item1, item2) => item1 > item2): Option<T> {
    return max(iter, (item1, item2) => !isSmaller(item1, item2));
}

export function foldl<T, U>(iter: Iterator<T>, foldFn: (item: T, accum: U, idx: number) => U, init: U): U {
    let accum = init;
    for(const [i,item] of enumerate(iter)) {
        accum = foldFn(item, accum, i);
    }
    return accum;
}

export const reduce = foldl;

export function sum(iter: Iterator<number>): number {
    return foldl(iter, (item, accum) => item + accum, 0);
}