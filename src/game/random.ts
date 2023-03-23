/**
 * Chooses an integer from the range [lower, upper)
 * @param lower - lower bound
 * @param upper - upper bound (exclusive)
 */
function randomInt(lower: number, upper: number): number {
    return Math.floor(Math.random() * (upper - lower)) + lower;
}

export { randomInt };