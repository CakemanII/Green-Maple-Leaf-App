/**
 * Calculators for derivative computation.
 * ONLY FOR 1st ORDER DERIVATIVES.
 */
class DerivativeCalculator {
    /**
     * Calculates the derivative of a value. 
     * (Average rate of change over two data points)
     */
    static calculate(a: number, b: number, deltaTime: number): number {
        return (b - a) / deltaTime;
    }
}

/**
 * Calculators for integrals computation.
 * ONLY FOR 1st ORDER INTEGRALS.
 */
class IntegralCalculator {
    /**
     * Calculates the integral of a value using a trapezoidal approximation.
     * (currentIntegral + 0.5 * (a + b) * deltaTime)
     */
    static calculate(currentIntegral: number, a: number, b: number, deltaTime: number): number {
        return currentIntegral + 0.5 * (a + b) * deltaTime;
    }
}