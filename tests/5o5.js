function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        result.push(chunk);
    }
    return result;
}

// Example usage:
const myArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const chunks = chunkArray(myArray, 5);
console.log(chunks);
