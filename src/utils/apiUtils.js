// Utility function for exponential backoff for API calls
export async function retryWithExponentialBackoff(fn, retries = 5, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i < retries - 1) {
                console.warn(`Retrying after error: ${error.message}. Attempt ${i + 1}/${retries}`);
                await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
            } else {
                throw error; // Re-throw if it's the last retry
            }
        }
    }
}