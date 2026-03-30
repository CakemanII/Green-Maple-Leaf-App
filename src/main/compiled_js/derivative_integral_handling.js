export class DerivativeIntegralHandler {
    static get INSTANCE() { return DerivativeIntegralHandler.instance; }
    // Lazy getter to avoid circular dependency
    get telemetryManager() {
        var _a;
        // Use dynamic import to break circular dependency
        return (_a = globalThis.GlobalTelemetryManager) === null || _a === void 0 ? void 0 : _a.INSTANCE;
    }
    constructor() {
        this.callbacksDictionary = {};
        // Ensure singleton
        if (DerivativeIntegralHandler.instance) {
            throw new Error("Use DerivativeIntegralHandler.INSTANCE to access the singleton instance.");
        }
        DerivativeIntegralHandler.instance = this;
    }
    setDerivativeIntegralCallback(call_key, output_key, calc_derivative, callback) {
        this.callbacksDictionary[call_key] = () => {
            const result = this.derivativeIntegralCallback(call_key, output_key, calc_derivative);
            if (result)
                callback(result[0], result[1], result[2]);
        };
    }
    derivativeIntegralCallback(input_key, output_key, calc_derivative) {
        var _a, _b;
        // Get all data from a specific input key
        const inputData = (_a = this.telemetryManager) === null || _a === void 0 ? void 0 : _a.getMostRecentDataPoints(input_key, 2);
        if (!inputData || inputData.length < 2) {
            console.warn(`[DerivativeIntegralHandler] Not enough data to calculate derivative/integral for key '${input_key}'.`);
            return null;
        }
        // Get the two data points
        const a = inputData[0];
        const b = inputData[1];
        // If not enough data points, skip
        if (!a || !b) {
            console.warn(`[DerivativeIntegralHandler] Not enough data points to calculate derivative/integral for key '${input_key}'.`);
            return null;
        }
        // Calculate time difference
        const deltaTime = b.x - a.x;
        // Check if data is Vector3D or single value
        const isVector3D = typeof a.y === 'object' && a.y !== null && 'x' in a.y && 'y' in a.y && 'z' in a.y;
        // Calculate derivative or integral
        if (calc_derivative) {
            // Calculate the time inbetween the points
            const midTime = (a.x + b.x) / 2;
            if (isVector3D) {
                // Calculate derivative for each component
                const derivativeValue = {
                    x: DerivativeCalculator.calculate(a.y.x, b.y.x, deltaTime),
                    y: DerivativeCalculator.calculate(a.y.y, b.y.y, deltaTime),
                    z: DerivativeCalculator.calculate(a.y.z, b.y.z, deltaTime)
                };
                return [output_key, midTime, derivativeValue];
            }
            else {
                // Calculate derivative for single value
                const derivativeValue = DerivativeCalculator.calculate(a.y, b.y, deltaTime);
                return [output_key, midTime, derivativeValue];
            }
        }
        else {
            // Get the last integral value if exists
            const lastOutputDataPoint = (_b = this.telemetryManager) === null || _b === void 0 ? void 0 : _b.getMostRecentDataPoints(output_key, 1);
            const lastIntegralValue = lastOutputDataPoint && lastOutputDataPoint.length > 0 ? lastOutputDataPoint[0].y : 0;
            if (isVector3D) {
                // Calculate integral for each component
                const lastVector = typeof lastIntegralValue === 'object' ? lastIntegralValue : { x: 0, y: 0, z: 0 };
                const integralValue = {
                    x: IntegralCalculator.calculate(lastVector.x, a.y.x, b.y.x, deltaTime),
                    y: IntegralCalculator.calculate(lastVector.y, a.y.y, b.y.y, deltaTime),
                    z: IntegralCalculator.calculate(lastVector.z, a.y.z, b.y.z, deltaTime)
                };
                return [output_key, b.x, integralValue];
            }
            else {
                // Calculate integral for single value
                const integralValue = IntegralCalculator.calculate(lastIntegralValue, a.y, b.y, deltaTime);
                return [output_key, b.x, integralValue];
            }
        }
    }
    /**
     * Called when a telemetry data point is received.
     */
    onTelemetryDataReceived(label) {
        const callback = this.callbacksDictionary[label];
        if (callback) {
            callback();
        }
    }
}
new DerivativeIntegralHandler();
/**
 * Calculators for derivative computation.
 * ONLY FOR 1st ORDER DERIVATIVES.
 */
class DerivativeCalculator {
    /**
     * Calculates the derivative of a value.
     * (Average rate of change over two data points)
     */
    static calculate(a, b, deltaTime) {
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
    static calculate(currentIntegral, a, b, deltaTime) {
        return currentIntegral + 0.5 * (a + b) * deltaTime;
    }
}
//# sourceMappingURL=derivative_integral_handling.js.map