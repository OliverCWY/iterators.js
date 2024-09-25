import * as accumulators from "./functional/accumulators";
import * as generators from "./functional/generators";
import * as staticGenerators from "./functional/static_generators";

type Exporter<T> = {
    [key in keyof T]: T[key]
} & {}

export type Acc =  Omit<typeof accumulators, "Ordering">;
export type Gen =   Exporter<typeof generators>;
export type SGen =  typeof staticGenerators;
