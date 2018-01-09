console.log("seedSrc npm hit");

const cryptographyExporter = require("./cryptography.js");

const cryptographyHelper = cryptographyExporter.newCryptographyHelper();
const cryptographyUnitTests = cryptographyExporter.newCryptographyUnitTests();

cryptographyUnitTests.RunTests();

console.log("Test Complete");