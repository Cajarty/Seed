console.log("seedSrc npm hit");

const cryptographyExporter = require("./cryptography.js");
const accountExporter = require("./account.js");

const cryptographyHelper = cryptographyExporter.newCryptoHelper();
let newAccount = accountExporter.newAccount({ entropy : "1349082123412353tgfdvrewfdvdfr43f34390413290413", network : "00" });
if (newAccount.privateKey == null) {
    console.log("Properly zero'd private key");
}
let signature = newAccount.sign("dataToSign");

accountExporter.runUnitTests();

console.log("Test Complete");