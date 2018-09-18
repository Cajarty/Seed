/******************
 * relay/index.js *
 ******************
 * 
 * The JavaScript loaded into the Relay DApp.
 * 
 * Communicates with the SeedHLAPI to use the "Relay" module and relay an empty transaction. 
 * These transactions are used to push the validation forward.
 */

const { PromiseIpc } = require('electron-promise-ipc');
const promiseIpc = new PromiseIpc({ maxTimeoutMs: 2000 });
const seedHLAPI = require("../../seedHLAPI.js").getSeedHLAPI(promiseIpc);

/**
 * Simulates one of 100 random accounts sending a relay transaction through the Relay module
 */
function relay() {
    let entropy = ("Z" + (Math.random() * 100) % 100) + "_123456789012345678901234567890";
    console.info("Relay1");
    seedHLAPI.switchAccount(entropy)
        .then(() => {
            console.info("Relay2");
            seedHLAPI.createAndPropagateTransaction("Relay", "relay", {}, 4);
        });
}