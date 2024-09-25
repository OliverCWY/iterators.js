import { Iterator, Generator } from "..";

export function* range(start: number, end?: number, step: number = 1): Generator<number> {
    if (end == undefined) {
        end = start;
        start = 0;
    }
    if (step > 0) {
        for(let item = start; item < end; item += step) {
            yield item;
        }
    } else {
        for(let item = start; item > end; item += step) {
            yield item;
        }
    }
}

export function* countNum(start: number, step: number = 1): Generator<number> {
    let current = start;
    while (1) {
        yield current;
        current += step;
    }
}

export function* repeat<T>(item: T, count?: number): Generator<T> {
    if (count == undefined) {
        while(1) {
            yield item;
        }
    } else {
        for(const _ of range(count)) {
            yield item;
        }
    }
}

export function* chainFromIterable<T>(iterOfIters: Iterator<Iterator<T>>): Generator<T> {
    for(const iter of iterOfIters) {
        for(const item of iter) {
            yield item;
        }
    }
}