/*************
 * ledger.js *
 *************
 * 
 * The active Ledger storing the current state of everything. All modules have their data stored here,
 * as well as the data of each user for each module. The ledger also knows what default data to apply for
 * each user upon the first time they use a module.
 * 
 * Currently lacks reading/writing state and starts fresh on every run.
 */

const conformHelper = require("./helpers/conformHelper.js");
const virtualMachineExporter = require("./virtualMachine/virtualMachine.js");
const squasherExporter = require("./squasher.js");
let ledger = null;

module.exports = {
    /**
     * Returns the active ledger, creating one if none exists
     */
    getLedger : function() {
        if (ledger == null) {
            ledger = new Ledger();
        }
        return ledger;
    },
    getUnitTests : function() {
        return ledgerUnitTests;
    }
 }

 /**
  * Class containing the logic for a ledger and how to use it
  */
 class Ledger {
     /**
      * Constructs the ledger, defaulting the moduleData and moduleInitialUserDatas variables to empty objects.
      */
    constructor() {
        this.moduleData = {};
        this.moduleInitialUserDatas = {};
    }

    /**
     * Adds a module to the ledger, so the ledger knows how the module wants its data to be formed
     * 
     * @param {*} moduleName - Name of the module being stored
     * @param {*} initialData - Initial default state of the modules data
     * @param {*} initialUserData - Initial default state of each user for the module
     */
    addModuleData(moduleName, initialData, initialUserData) {
        this.moduleData[moduleName] = conformHelper.deepCopy(initialData);
        this.moduleData[moduleName].userData = {};
        this.moduleInitialUserDatas[moduleName] = conformHelper.deepCopy(initialUserData);
    }

    /**
     * Adds a user to a module, creating a copy of the initialUserData for that user
     * 
     * @param {*} moduleName - Name of the module to store into
     * @param {*} user - Public address of the user to add to the module
     */
    addUserData(moduleName, user) {
        if (this.moduleData[moduleName].userData[user] == undefined) {
            this.moduleData[moduleName].userData[user] = conformHelper.deepCopy(this.moduleInitialUserDatas[moduleName]);
        }
    }

    /**
     * Fetches the module data for a given module, however returns a deep copy.
     * Using this method allows users to modify the returned data without modifying the state of the ledger
     * 
     * @param {*} moduleName - The name of the module who's data is being fetched
     */
    getCopyOfModuleData(moduleName) {
        return conformHelper.deepCopy(this.moduleData[moduleName]);
    }

    /**
     * Fetches the module data for a given module by reference.
     * 
     * WARNING: Using this method allows users to modify the returned data directly. This is dangerous
     * 
     * @param {*} moduleName - The name of the module who's data is being fetched
     */
    getModuleData(moduleName) {
        return this.moduleData[moduleName];
    }

    /**
     * Fetches a users data inside a given module by reference
     * 
     * @param {*} moduleName - The name of the module to fetch from
     * @param {*} user - Public address of the user who's data is being fetched
     */
    getUserData(moduleName, user) {
        return this.moduleData[moduleName].userData[userData];
    }
    
    /**
     * Applys the changes from a ChangeContext object onto the ledgers data.
     * This uses the Squasher's Squash export to handle the squashing of data
     * 
     * @param {*} moduleName - Name of the module who was modified
     * @param {*} changeContext - The ChangeContext of data to apply to the ledger
     */
    applyChanges(moduleName, changeContext) {
        let users = Object.keys(changeContext.userData);
        let moduleDataKeys = Object.keys(changeContext.moduleData);

        if (users.length == 0 && moduleDataKeys.length == 0) {
            console.info("Ledger::ERROR::applyChanges: Cannot apply no-changes");
            return;
        }

        // Add initial user data if a new one is being used
        let moduleDataToUpdate = this.getModuleData(moduleName);
        for(let i = 0; i < users.length; i++) {
            if (moduleDataToUpdate.userData[users[i]] == undefined) {
                this.addUserData(moduleName, users[i]);
            }
        }

        // Old module data we are overwriting
        let oldData = Object.assign(this.moduleData);

        // Store the incoming changeContext into an object which follows the same schema
        let newData = {}
        newData[moduleName] = changeContext.moduleData;
        newData[moduleName]["userData"] = changeContext.userData;

        //Squash and save
        this.moduleData = squasherExporter.squash(oldData, newData);
    }

    applyBlock(block) {
        let changeSet = JSON.parse(block.changeSet);
        let keys = Object.keys(changeSet);
        for(let i = 0; i < keys.length; i++) {
            let moduleName = keys[i];
            let changeContext = { 
                moduleData : changeSet[moduleName], 
                userData : changeSet[moduleName]["userData"]
            }
            this.applyChanges(moduleName, changeContext);
        }
    }
 }

 const ledgerUnitTests = {
    /**
     * Confirm that the ledger can be read from.
     */
    ledger_readFromLedger : function(test, log) {
        let seedData = module.exports.getLedger().getModuleData("Seed");
        test.assertAreEqual(seedData.totalSupply, 0, "Should have no supply in circulation");
        test.assertAreEqual(seedData.symbol, "SEED", "The default symbol for SEED should");
        test.assertAreEqual(seedData.decimals, 4, "The default symbol for SEED should");
    },
    /**
     * Confirm the ledger can have changes applied to it which change the state of the ledger.
     */
    ledger_appliedChangesModifyState : function(test, log) {
        test.assertAreEqual(module.exports.getLedger().getModuleData("Seed").totalSupply, 0, "Should have no supply in circulation");
        module.exports.getLedger().applyChanges("Seed", { 
            "moduleData" : { totalSupply : 10 },
            "userData" : {}
        });
        test.assertAreEqual(module.exports.getLedger().getModuleData("Seed").totalSupply, 10, "Should have been changed to 10 SEED in circulation");
        module.exports.getLedger().applyChanges("Seed", { 
            "moduleData" : { totalSupply : -10 },
            "userData" : {}
        });
        test.assertAreEqual(module.exports.getLedger().getModuleData("Seed").totalSupply, 0, "Should have been changed to 10 SEED in circulation");
    },
    /**
     * Confirm the ledger can create a deep copy of module data
     */
    ledger_canCreateDeepCopiesOfModuleData : function(test, log) {
        let seedData = module.exports.getLedger().getCopyOfModuleData("Seed");
        test.assert(seedData != undefined, "Must have returned data");
        seedData.totalSupply = 5;
        test.assertAreEqual(module.exports.getLedger().getModuleData("Seed").totalSupply, 0, "Should not have been changed by modifying the returned copy");
    },
    /**
     * Confirm numerous transactions can have their changes applied and get the correct result.
     */
    ledger_multipleTransactionsChangingInSequenceGivesCorrectResult : function(test, log) {
        let transactionsJSON = [ 
            {"transactionHash":"4e494998049f709438c80ccc8d351573683937341c83ae9db869259651f3c9a7","sender":"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591","execution":{"moduleName":"Relay","functionName":"relay","args":{},"moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":2},\"userData\":{\"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591\":{\"relays\":2}},\"user\":\"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"9762b25304ce5fa514cc3f0a2687ad59c522d0ebbd65330dc85ce3d6d58dcebe","moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":3},\"userData\":{\"044eaf2b043334a659b9e3d4123c4c33cfbdbc1a3610d3b0734ea80a72215474ad6fb2837824f8270f91dd3fe8905e6ee68291bca7d2c6ac1fe67edb28450b4368\":{\"relays\":3}},\"user\":\"044eaf2b043334a659b9e3d4123c4c33cfbdbc1a3610d3b0734ea80a72215474ad6fb2837824f8270f91dd3fe8905e6ee68291bca7d2c6ac1fe67edb28450b4368\",\"dependencies\":[]}"},{"transactionHash":"621c6ce08d2928c3213e619d93723bff8625c28ef8cd63ca368daca26107f753","moduleChecksum":"fd37","functionChecksum":"48ef","changeSet":"{\"moduleData\":{},\"userData\":{\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\":{\"balance\":-50},\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\":{\"balance\":50}},\"user\":\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\",\"dependencies\":[]}"}],"signature":"3044022025f60da583561d50a52127d35fb035af6c3eabe702ec2cf2b6e2b7f6d303e27b02206396d3c60ee7bce68cef706690295a30c2944e4d2a6e9531efdcc98e7d3bf38f","timestamp":1536513258201},
            {"transactionHash":"4f95dc9fca4f60827d3f6923dca45cfa85bfaa58cbbe56d16dc39b54ea8d4247","sender":"04997560ba923c3ace36510c44a849931c22e8954e93ccd24423965783e3d42e74b983523f2375e5b6db35498594457ba8ea5ca0bee3fd8a0eecbf470aca941788","execution":{"moduleName":"Relay","functionName":"relay","args":{},"moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":2},\"userData\":{\"04997560ba923c3ace36510c44a849931c22e8954e93ccd24423965783e3d42e74b983523f2375e5b6db35498594457ba8ea5ca0bee3fd8a0eecbf470aca941788\":{\"relays\":2}},\"user\":\"04997560ba923c3ace36510c44a849931c22e8954e93ccd24423965783e3d42e74b983523f2375e5b6db35498594457ba8ea5ca0bee3fd8a0eecbf470aca941788\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"a27c70a28ce1f5042a0567215544c5921207d0fe533fa9184bcd48480a9fca5f","moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":3},\"userData\":{\"04dc7edb019ea527fa626f7bb69b05a6f561c0feac2fef1bd416b8c626c3fe89b1955d5038f75d0fee5c1059f79ea93eefd103a788f764b57949f39b811aa2d3fa\":{\"relays\":3}},\"user\":\"04dc7edb019ea527fa626f7bb69b05a6f561c0feac2fef1bd416b8c626c3fe89b1955d5038f75d0fee5c1059f79ea93eefd103a788f764b57949f39b811aa2d3fa\",\"dependencies\":[]}"},{"transactionHash":"652c3589b7a0da85c0144599c11c5fe724313cc2b159f6c4f9445fe2cd2b66c7","moduleChecksum":"fd37","functionChecksum":"48ef","changeSet":"{\"moduleData\":{},\"userData\":{\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\":{\"balance\":-50},\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\":{\"balance\":50}},\"user\":\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\",\"dependencies\":[]}"}],"signature":"30460221008e4b34eb0ce48735f3aa55920b31777973c783c670a96808a75bfe303c8bad03022100976d76450e84b5ab5133fb3587eb12d1bb0fd8072559102f7eb61f28bea6512d","timestamp":1536110596764},
            {"transactionHash":"5d2e6ed3f77db4c4259d12d7c6888fdf6bc9e886969e0e23402bd63fe3e698d3","sender":"04dbffccdc3e448f968ec9ec7ac689ee932b723e50747409854d8a4f6a4637d5537fc47e5535d06b1465e36eca5adc7f223fff129030501a1ca82a68dfbaf94efa","execution":{"moduleName":"Relay","functionName":"relay","args":{},"moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":1},\"userData\":{\"04dbffccdc3e448f968ec9ec7ac689ee932b723e50747409854d8a4f6a4637d5537fc47e5535d06b1465e36eca5adc7f223fff129030501a1ca82a68dfbaf94efa\":{\"relays\":1}},\"user\":\"04dbffccdc3e448f968ec9ec7ac689ee932b723e50747409854d8a4f6a4637d5537fc47e5535d06b1465e36eca5adc7f223fff129030501a1ca82a68dfbaf94efa\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"93f0f79237c78bc28ffdf00ced2a506be24e7b913e182fbdde817b159014c052","moduleChecksum":"fd37","functionChecksum":"ddf3","changeSet":"{\"moduleData\":{\"totalSupply\":1000},\"userData\":{\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\":{\"balance\":1000}},\"user\":\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\",\"dependencies\":[]}"}],"signature":"3045022100ea9a5dbecc74ff485d61db9af007f178d4aef3ce20310afa4f50ca8d60d7aaef02203363780c7129be556f8b9fc9e27e0517fb3d9ee4f5327fefab4b06539bd69dfa","timestamp":1536513258112}
        ]
        let oldModuleData = module.exports.getLedger().getCopyOfModuleData("Relay");
        for(let i = 0; i < transactionsJSON.length; i++) {
            module.exports.getLedger().applyChanges(transactionsJSON[i].execution.moduleName, JSON.parse(transactionsJSON[i].execution.changeSet));
        }
        let moduleData = module.exports.getLedger().getModuleData("Relay");
        test.assertAreEqual(moduleData.totalRelays, 5, "Should have five relays between the three transactions");
        module.exports.getLedger().moduleData["Relay"] = oldModuleData;
    },
    /**
     * Confirm a block can have its changes applied to the ledger and get the correct result.
     */
    ledger_appliedChangesFromBlockGiveSameResult : function(test, log) {
        let transactionsJSON = [ 
            {"transactionHash":"4e494998049f709438c80ccc8d351573683937341c83ae9db869259651f3c9a7","sender":"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591","execution":{"moduleName":"Relay","functionName":"relay","args":{},"moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":2},\"userData\":{\"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591\":{\"relays\":2}},\"user\":\"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"9762b25304ce5fa514cc3f0a2687ad59c522d0ebbd65330dc85ce3d6d58dcebe","moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":3},\"userData\":{\"044eaf2b043334a659b9e3d4123c4c33cfbdbc1a3610d3b0734ea80a72215474ad6fb2837824f8270f91dd3fe8905e6ee68291bca7d2c6ac1fe67edb28450b4368\":{\"relays\":3}},\"user\":\"044eaf2b043334a659b9e3d4123c4c33cfbdbc1a3610d3b0734ea80a72215474ad6fb2837824f8270f91dd3fe8905e6ee68291bca7d2c6ac1fe67edb28450b4368\",\"dependencies\":[]}"},{"transactionHash":"621c6ce08d2928c3213e619d93723bff8625c28ef8cd63ca368daca26107f753","moduleChecksum":"fd37","functionChecksum":"48ef","changeSet":"{\"moduleData\":{},\"userData\":{\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\":{\"balance\":-50},\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\":{\"balance\":50}},\"user\":\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\",\"dependencies\":[]}"}],"signature":"3044022025f60da583561d50a52127d35fb035af6c3eabe702ec2cf2b6e2b7f6d303e27b02206396d3c60ee7bce68cef706690295a30c2944e4d2a6e9531efdcc98e7d3bf38f","timestamp":1536513258201},
            {"transactionHash":"4f95dc9fca4f60827d3f6923dca45cfa85bfaa58cbbe56d16dc39b54ea8d4247","sender":"04997560ba923c3ace36510c44a849931c22e8954e93ccd24423965783e3d42e74b983523f2375e5b6db35498594457ba8ea5ca0bee3fd8a0eecbf470aca941788","execution":{"moduleName":"Relay","functionName":"relay","args":{},"moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":2},\"userData\":{\"04997560ba923c3ace36510c44a849931c22e8954e93ccd24423965783e3d42e74b983523f2375e5b6db35498594457ba8ea5ca0bee3fd8a0eecbf470aca941788\":{\"relays\":2}},\"user\":\"04997560ba923c3ace36510c44a849931c22e8954e93ccd24423965783e3d42e74b983523f2375e5b6db35498594457ba8ea5ca0bee3fd8a0eecbf470aca941788\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"a27c70a28ce1f5042a0567215544c5921207d0fe533fa9184bcd48480a9fca5f","moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":3},\"userData\":{\"04dc7edb019ea527fa626f7bb69b05a6f561c0feac2fef1bd416b8c626c3fe89b1955d5038f75d0fee5c1059f79ea93eefd103a788f764b57949f39b811aa2d3fa\":{\"relays\":3}},\"user\":\"04dc7edb019ea527fa626f7bb69b05a6f561c0feac2fef1bd416b8c626c3fe89b1955d5038f75d0fee5c1059f79ea93eefd103a788f764b57949f39b811aa2d3fa\",\"dependencies\":[]}"},{"transactionHash":"652c3589b7a0da85c0144599c11c5fe724313cc2b159f6c4f9445fe2cd2b66c7","moduleChecksum":"fd37","functionChecksum":"48ef","changeSet":"{\"moduleData\":{},\"userData\":{\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\":{\"balance\":-50},\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\":{\"balance\":50}},\"user\":\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\",\"dependencies\":[]}"}],"signature":"30460221008e4b34eb0ce48735f3aa55920b31777973c783c670a96808a75bfe303c8bad03022100976d76450e84b5ab5133fb3587eb12d1bb0fd8072559102f7eb61f28bea6512d","timestamp":1536110596764},
            {"transactionHash":"5d2e6ed3f77db4c4259d12d7c6888fdf6bc9e886969e0e23402bd63fe3e698d3","sender":"04dbffccdc3e448f968ec9ec7ac689ee932b723e50747409854d8a4f6a4637d5537fc47e5535d06b1465e36eca5adc7f223fff129030501a1ca82a68dfbaf94efa","execution":{"moduleName":"Relay","functionName":"relay","args":{},"moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":1},\"userData\":{\"04dbffccdc3e448f968ec9ec7ac689ee932b723e50747409854d8a4f6a4637d5537fc47e5535d06b1465e36eca5adc7f223fff129030501a1ca82a68dfbaf94efa\":{\"relays\":1}},\"user\":\"04dbffccdc3e448f968ec9ec7ac689ee932b723e50747409854d8a4f6a4637d5537fc47e5535d06b1465e36eca5adc7f223fff129030501a1ca82a68dfbaf94efa\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"93f0f79237c78bc28ffdf00ced2a506be24e7b913e182fbdde817b159014c052","moduleChecksum":"fd37","functionChecksum":"ddf3","changeSet":"{\"moduleData\":{\"totalSupply\":1000},\"userData\":{\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\":{\"balance\":1000}},\"user\":\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\",\"dependencies\":[]}"}],"signature":"3045022100ea9a5dbecc74ff485d61db9af007f178d4aef3ce20310afa4f50ca8d60d7aaef02203363780c7129be556f8b9fc9e27e0517fb3d9ee4f5327fefab4b06539bd69dfa","timestamp":1536513258112}
        ]
        let oldModuleData = module.exports.getLedger().getCopyOfModuleData("Relay");
        let block = require("./squasher.js").transactionsToBlock(transactionsJSON);
        module.exports.getLedger().applyBlock(block);
        test.assertAreEqual(module.exports.getLedger().getModuleData("Relay").totalRelays, 5, "Should have five relays between the three transactions that are now squashed in the block");
        module.exports.getLedger().moduleData = [];
        module.exports.getLedger().moduleData["Relay"] = oldModuleData;
    }
}