import {DateFactory, DateFactoryParts} from "./core";

class CompositeDateFactory implements DateFactory {
    constructor(private factories: DateFactory[]) {
    }

    create(parts: DateFactoryParts): Date {
        for (const factory of this.factories) {
            try {
                return factory.create(parts);
            } catch (e) {
            }
        }
        throw new Error(`Unable to create date for ${JSON.stringify(parts)}`);
    }
}

export function compositeDateFactory(...factories: DateFactory[]): DateFactory {
    return new CompositeDateFactory(factories)
}