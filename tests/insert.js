let myArray = [1, 2, 3, 4, 5];
let indexToInsert = 2; // Position where you want to insert
let itemToInsert = 99;

// Using splice to insert the item
myArray.splice(indexToInsert, 0, itemToInsert);

console.log(myArray); // Output: [1, 2, 99, 3, 4, 5]
