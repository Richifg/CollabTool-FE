/* eslint-disable @typescript-eslint/no-explicit-any */

// returns a debounced version of the provided function
function getDebouncedFunction<F extends (...args: any[]) => void>(func: F, delay: number): (...args: Parameters<F>) => void {
    let id: NodeJS.Timeout;
    return (...args: Parameters<F>) => {
        clearTimeout(id);
        id = setTimeout(() => func(...args), delay);
    };
}

export default getDebouncedFunction;
