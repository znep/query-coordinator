/**
 * To be able to stub out window.location in tests, these are being wrapped in functions
 * If more window.location functions are used, this is where they should be added
 */

export const assign = (path) => window.location.assign(path);
export const pathname = () => window.location.pathname;
