console.log("seedSrc npm hit");

const cryptographyExporter = require("./cryptography.js");

const cryptographyHelper = cryptographyExporter.createCryptographyHelper();
const cryptographyUnitTests = cryptographyExporter.createCryptographyUnitTests();

cryptohelper.RunTests();

console.log("Test Complete");