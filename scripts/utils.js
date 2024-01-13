export const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

export const createElement = (tagName, props = {}, children = []) => {
    const root = Object.assign(document.createElement(tagName), props);
    children.forEach(child => root.appendChild(child));
    return root;
};
