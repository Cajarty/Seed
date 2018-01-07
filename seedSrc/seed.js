console.log("seedSrc npm hit");

;

const cryptohelper = require("./cryptography.js").createCryptographyUnitTests();
console.log(cryptohelper);
cryptohelper.RunTests();

console.log("Test Complete");