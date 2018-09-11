/******************
 * unitTesting.js *
 ******************
 * 
 * Exports functions related to running unit tests or creating unit tests.
 * 
 */

module.exports = {
    /**
     * Runs all modules for unit tests which are hard-coded into this function for loading.
     * Modules to test are expected to have a "runUnitTests(verbose)" function available, which
     * returns a test result object of type { fails : array, passes : number }
     * 
     * @param verbose - Whether to write extra debug lines or not
     */
    runAllUnitTests : function(verbose) {
        console.info("#### Running All Unit Tests");

        let subsystemUnitTests = {
            Cryptography : require("../helpers/cryptoHelper.js").getUnitTests(),
            Account : require("../account.js").getUnitTests(),
            Random : require("../helpers/random.js").getUnitTests(),
            Block : require("../block.js").getUnitTests(),
            Transaction : require("../transaction.js").getUnitTests(),
            Squasher : require("../squasher.js").getUnitTests(),
            Entanglement : require("../entanglement.js").getUnitTests(),
            Blockchain : require("../blockchain.js").getUnitTests(),
            Ledger : require("../ledger.js").getUnitTests(),
            SVM : require("../virtualMachine/virtualMachine.js").getUnitTests(),
            FileStorage : require("../storage/fileSystemInjector.js").getUnitTests(),
            LocalStorage : require("../storage/localStorageInjector.js").getUnitTests(),
            Storage : require("../storage/storage.js").getUnitTests(),
            Messaging : require("../messaging.js").getUnitTests()
        };

        let log = function(param1, param2, param3) {
            if (verbose) {
                if (!param3) {
                    if (!param2) {
                        if (param1) {
                            console.log(param1);
                        }
                    } else {
                        console.info(param1, param2);
                    }
                } else {
                    console.info(param1, param2, param3);
                }
            }
        }

        let test = new Test(verbose);

        for(let i = 0; i < Object.keys(subsystemUnitTests).length; i++) {
            let unitTestsName = Object.keys(subsystemUnitTests)[i];
            let unitTests = subsystemUnitTests[unitTestsName];
            log("### Running " + unitTestsName + " Tests");
            runBundledTests(test, unitTests, verbose, log);
        }


        setTimeout(() => {
            console.info("#### Tests Complete");
            test.logState();
        }, 1000);
    },
    getTestTransactions : function() {
        return [
            {"transactionHash":"4e494998049f709438c80ccc8d351573683937341c83ae9db869259651f3c9a7","sender":"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591","execution":{"moduleName":"Relay","functionName":"relay","args":{},"moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":2},\"userData\":{\"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591\":{\"relays\":2}},\"user\":\"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"9762b25304ce5fa514cc3f0a2687ad59c522d0ebbd65330dc85ce3d6d58dcebe","moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":3},\"userData\":{\"044eaf2b043334a659b9e3d4123c4c33cfbdbc1a3610d3b0734ea80a72215474ad6fb2837824f8270f91dd3fe8905e6ee68291bca7d2c6ac1fe67edb28450b4368\":{\"relays\":3}},\"user\":\"044eaf2b043334a659b9e3d4123c4c33cfbdbc1a3610d3b0734ea80a72215474ad6fb2837824f8270f91dd3fe8905e6ee68291bca7d2c6ac1fe67edb28450b4368\",\"dependencies\":[]}"},{"transactionHash":"621c6ce08d2928c3213e619d93723bff8625c28ef8cd63ca368daca26107f753","moduleChecksum":"fd37","functionChecksum":"48ef","changeSet":"{\"moduleData\":{},\"userData\":{\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\":{\"balance\":-50},\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\":{\"balance\":50}},\"user\":\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\",\"dependencies\":[]}"}],"signature":"3044022025f60da583561d50a52127d35fb035af6c3eabe702ec2cf2b6e2b7f6d303e27b02206396d3c60ee7bce68cef706690295a30c2944e4d2a6e9531efdcc98e7d3bf38f","timestamp":1536513258201},
            {"transactionHash":"5591139c1b1cac1b4d0b9a351d869c1e8035ec29f15cfec61374492e459bf090","sender":"0411aef20e14da2d9fff17c5ad3aec899cf443be328611cc689e006f8e58ccc95e071d2c38f01cd14cc73d1dbc6bad2914a75fc2796cd7e8740dac8dd8c3d21e41","execution":{"moduleName":"Relay","functionName":"relay","args":{},"moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":2},\"userData\":{\"0411aef20e14da2d9fff17c5ad3aec899cf443be328611cc689e006f8e58ccc95e071d2c38f01cd14cc73d1dbc6bad2914a75fc2796cd7e8740dac8dd8c3d21e41\":{\"relays\":2}},\"user\":\"0411aef20e14da2d9fff17c5ad3aec899cf443be328611cc689e006f8e58ccc95e071d2c38f01cd14cc73d1dbc6bad2914a75fc2796cd7e8740dac8dd8c3d21e41\",\"dependencies\":[]}"},"validatedTransactions":[{"transactionHash":"308c0cca1baf8646428a0ba87b289ed38b648edb0f090b042ce710073fc3e352","moduleChecksum":"fd37","functionChecksum":"49d5","changeSet":"{\"moduleData\":{\"totalSupply\":-25},\"userData\":{\"04e27f7b1a3c08a218c3add342cb5d540fb58ecc5906a8e20763412abb9ebd3126fe4ff40c45bc6361e5428b0faa56fd061041072b1f27e0b574f8881c374baaa0\":{\"balance\":-25}},\"user\":\"04e27f7b1a3c08a218c3add342cb5d540fb58ecc5906a8e20763412abb9ebd3126fe4ff40c45bc6361e5428b0faa56fd061041072b1f27e0b574f8881c374baaa0\",\"dependencies\":[]}"},{"transactionHash":"5d9366698df744ddb04f4d29d91f3a6d1f96e84e95354f3cd5df58ce30d16371","moduleChecksum":"ec72","functionChecksum":"4b75","changeSet":"{\"moduleData\":{\"totalRelays\":2},\"userData\":{\"04318cfd9e16640aa16ee586eadf54f37b481e37a190b52cb2a023d4787d3248a57b257f37cb8f38867754c10ce7df42fcd4513ea21df7da912b22ebb484ca22b8\":{\"relays\":2}},\"user\":\"04318cfd9e16640aa16ee586eadf54f37b481e37a190b52cb2a023d4787d3248a57b257f37cb8f38867754c10ce7df42fcd4513ea21df7da912b22ebb484ca22b8\",\"dependencies\":[]}"}],"signature":"3045022100dad899ee2e33cfcdd32ef837e206d00af359d78e38f61465d9bd82408a0532b002202c7e97cb0eef541d6a3807614e90155b03082672ac65e0dc4c72f548de5bb23b","timestamp":1536110596797}
        ]
    },
    getTestBlocks : function() {
        return [
            {"generation" : 1,"transactions" : "{ \"4e494998049f709438c80ccc8d351573683937341c83ae9db869259651f3c9a7\" : [\"04da3bca100a26200fd19eb848f783ae5a760f68b81d306397a6e6d2ef6cd8c2cd761efc39b51129ce73d2be79e2948a0930598f382508d4e0a917191606ca1591\", \"ec72\", \"4b75\", \"{}\", \"3044022025f60da583561d50a52127d35fb035af6c3eabe702ec2cf2b6e2b7f6d303e27b02206396d3c60ee7bce68cef706690295a30c2944e4d2a6e9531efdcc98e7d3bf38f\"] }","changeSet" : "{ \"Relay\" : \"totalRelays\":1, \"userData\":{\"044eaf2b043334a659b9e3d4123c4c33cfbdbc1a3610d3b0734ea80a72215474ad6fb2837824f8270f91dd3fe8905e6ee68291bca7d2c6ac1fe67edb28450b4368\":{\"relays\":3}},\"user\":\"044eaf2b043334a659b9e3d4123c4c33cfbdbc1a3610d3b0734ea80a72215474ad6fb2837824f8270f91dd3fe8905e6ee68291bca7d2c6ac1fe67edb28450b4368\"}","timestamp" : 1536513258201,"blockHash" : "bbcb78dc89c4e184fccc79bbbf5afe7e58915b58b1b604ff2a55a32420e0d86c"},
            {"generation":1,"transactions":"{\"93f0f79237c78bc28ffdf00ced2a506be24e7b913e182fbdde817b159014c052\":[\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\",\"fd37\",\"ddf3\",\"{\\\"initialSeed\\\":1000}\",\"304502204cfc76d8dfded9b3e08eed7b06da2f7e38e344c74830569177b4a9ad8afd5fa3022100e9b1353030d239598265645f2c72103e44d1ac3571fa56c58a6968a163be0499\"],\"243cdd2f8d9b8bbfd7a38f72c9e14e80f0666d983d6d62c00a6dfa12c194e60c\":[\"04c84274423f40b7d781e720cade5897ecc019b7c81d5c41139e4a8ae629d88c97a2b2ec85c784aee4e002f85ce349f6e747ce6ea4a4de61a4a52d0cc59261c3cd\",\"ec72\",\"4b75\",\"{}\",\"30440220648e541f043b348caa4cc12f5743d0a045541a813fcc8dcd2f41ba80963f315a022021fe3e4a8058455e32f09a7a7032329fea7cf2b061cf4d5390d6806839a0e690\"],\"d271b119dccb789f7b8f84921a46e27b5ba7e3353777086b78ffd5eba64e1f46\":[\"0429f693a8f9c2f855fb3ad6d0ba4230b893b35cea29b3fc92de85b46d9d1a359328e7dad597dd24d6f0a58c2679e7f69251017c272630284dab8249c481689008\",\"ec72\",\"4b75\",\"{}\",\"3046022100cbfc9ebca26d6be8e3fa0a5530e3b477c987e2e68d5ccc9b271859428d4fe2a8022100fd158ab8d5f31956b8f74f8ad218064cccf6001ec63d2c2663d81e16db16aed8\"],\"b302d9d181cd7186171c7a7c9777c26023bb996f7dd663592e2624a7230a292a\":[\"045f75e3667c026ef977b4ee89dd92e9ee4b92b7902c7aa87f4beef8102d0c36cbbf3492df4908dcadb1e2a66a75ae33a9bc634e73ec5fc002cfb0383f398e8cc2\",\"ec72\",\"4b75\",\"{}\",\"3044022043d6c5b73eacd79c3fa105d5918e095a9ca0292e6c1f87b14d4bbc6eb3ac649f022027e388d06e5185049e3aa8750df426b2d32d3496bc3ec7a071fad4f4f109a98e\"],\"eba38477d36b64c0b85e6a729956f79d0c88860368b0748752369bf6bbf1c06d\":[\"04b68dae578b7944d82e8d313b075992d52c139468c7831b6897eb9862249c81e1c464846d14d045b195a339b414fd95a65b7d1195157cbe601aff7da72b85de76\",\"ec72\",\"4b75\",\"{}\",\"30440220719f118788b7aca8652f97d5eada89447cd3782b35d51ed23be26843df2966ad022056991be363e71f0445a1a0803236bddced2987cbd31116326185a5d05fb52dd9\"],\"8e4eba26e8382834121ce8b07bbe17abc19e6405d4c1d3cdbf93578a42e7fe18\":[\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\",\"fd37\",\"4cf0\",\"{\\\"spender\\\":\\\"04e27f7b1a3c08a218c3add342cb5d540fb58ecc5906a8e20763412abb9ebd3126fe4ff40c45bc6361e5428b0faa56fd061041072b1f27e0b574f8881c374baaa0\\\",\\\"value\\\":250}\",\"3045022075f88a65019946ff6888b4003cd40789b072ee1a5edc966644ac0bc624463f63022100a6f7ca6be7ee6b04836249734abf19dba9b114b61ca52b053e6714cc72cf6f23\"],\"78c07bec02213f58c058c578f5fd139bd36c970ee0bb70d3ba9ee0ba93057bc2\":[\"04021403d8391d58987a7463c115461745b2d21a8972313241b24e2b0e94305b3004c007424fd3d9dc6fd0348ffe1237694c2bd8fe8cc36e08769c427fdfcbd103\",\"ec72\",\"4b75\",\"{}\",\"304602210090fe89a60f5785ed9603d6729a08ec4bb390ff56ca79589c869f6c3f4a936967022100992f242587a3933f9c7f0f22d979c6dac137007be08cdb3a7b77ffe248bf3295\"],\"dd6d13e2ee45d6b0a6a772e526e09d87a1f675ee53f71eb24c3ae7b132342818\":[\"0441b1f8e74770855bd04e93ff939cd04d6c255fd6151232318de6953bf5ac9d829bf054300a00e8d16098f29925343754dc74469b27de61663f2b8e6e690bc2e7\",\"ec72\",\"4b75\",\"{}\",\"304602210092a14a5efc9562ed8cae59e0de4e115f8e164138c62ab3cad9b2bf847df5d5c902210088e6b45a5bb36da698f9da2676784d2bad0afc0577b021d41692457492065a81\"],\"0f2ab2b75513de05f3c8186e4e58dcb1a02b01a2f9c3a5b3038f4effe680bc09\":[\"04e27f7b1a3c08a218c3add342cb5d540fb58ecc5906a8e20763412abb9ebd3126fe4ff40c45bc6361e5428b0faa56fd061041072b1f27e0b574f8881c374baaa0\",\"fd37\",\"4481\",\"{\\\"from\\\":\\\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\\\",\\\"to\\\":\\\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\\\",\\\"value\\\":100}\",\"3046022100d94f45824c30d5ca585dff3ba7b4cb644b6ff040560d1c112bda789f90205a9f022100c099572ba64e743fc4b9694164c665dabe84a005afff06e91af1c2fd3cdc1106\"]}","changeSet":"{\"Seed\":{\"totalSupply\":1000,\"userData\":{\"0452c7225d98f5b07a272d8fcfd15ae29d2f555e2d1bf0b72cf325f3f9d7037006cae70fe958a6224caf5749ec6b56d0a5b27b2db6c3a0777bcb733766e61b56db\":{\"balance\":900,\"allowance\":{\"04e27f7b1a3c08a218c3add342cb5d540fb58ecc5906a8e20763412abb9ebd3126fe4ff40c45bc6361e5428b0faa56fd061041072b1f27e0b574f8881c374baaa0\":150}},\"049df4409dcaaa257135596c81268d0a28398499623af7d032709d3f17c2fa776fca25f4fbbff8175a6ab2ea0701d4c75c98ff71dcd1cf856baf673bbfb2c4e70a\":{\"balance\":100}}},\"Relay\":{\"totalRelays\":11,\"userData\":{\"04c84274423f40b7d781e720cade5897ecc019b7c81d5c41139e4a8ae629d88c97a2b2ec85c784aee4e002f85ce349f6e747ce6ea4a4de61a4a52d0cc59261c3cd\":{\"relays\":1},\"0429f693a8f9c2f855fb3ad6d0ba4230b893b35cea29b3fc92de85b46d9d1a359328e7dad597dd24d6f0a58c2679e7f69251017c272630284dab8249c481689008\":{\"relays\":2},\"045f75e3667c026ef977b4ee89dd92e9ee4b92b7902c7aa87f4beef8102d0c36cbbf3492df4908dcadb1e2a66a75ae33a9bc634e73ec5fc002cfb0383f398e8cc2\":{\"relays\":2},\"04b68dae578b7944d82e8d313b075992d52c139468c7831b6897eb9862249c81e1c464846d14d045b195a339b414fd95a65b7d1195157cbe601aff7da72b85de76\":{\"relays\":2},\"04021403d8391d58987a7463c115461745b2d21a8972313241b24e2b0e94305b3004c007424fd3d9dc6fd0348ffe1237694c2bd8fe8cc36e08769c427fdfcbd103\":{\"relays\":2},\"0441b1f8e74770855bd04e93ff939cd04d6c255fd6151232318de6953bf5ac9d829bf054300a00e8d16098f29925343754dc74469b27de61663f2b8e6e690bc2e7\":{\"relays\":2}}}}","timestamp":1536110596722,"blockHash":"6dcdbda77967613fd76d2dd6ffb35bbb02818a67800786fd987121ff6ec0f575"}
        ]
    }
}



let runBundledTests = function(test, unitTests, verbose, log) {
    let keys = Object.keys(unitTests);
    for(let i = 0; i < keys.length; i++) {
        let unitTestName = keys[i];
        log("## Running Unit Test " + unitTestName);
        test.newSegment(unitTestName);
        unitTests[unitTestName](test, log);
    }
}

/**
 * A class which helps determine whether a Test fails or passes the tests, preparing which
 * ones failed in a list of error messages.
 */
class Test {
    /**
     * Creates the Test to be of type { passes : number, fails : array }
     * @param verbose - A flag to be set for whether to debug all lines
     */
    constructor(verbose) {
        this.passes = {};
        this.fails = {};
        this.segments = [];
        this.verbose = verbose;
        this.segmentName = "N/A";
    }

    /**
     * If the expression is true, this is a pass. Otherwise, add the fail message to the fails array
     * 
     * @param {*} expression - Expression we check for true or false
     * @param {*} failMessage - Error emssage to display on fail
     */
    assert(expression, failMessage) {
        if (expression) {
            if (!this.passes[this.segmentName]) {
                this.passes[this.segmentName] = 0;
            }
            this.passes[this.segmentName]++;
        } else {
            if (!this.fails[this.segmentName]) {
                this.fails[this.segmentName] = [];
            }
            this.fails[this.segmentName].push(this.segmentName + ":: " + failMessage);
        }
    }

    /**
     * If the first two parameters are equivalent by the double-equals tandard, this is a pass. Otherwise, add the fail message to the fails array
     * 
     * @param {*} expression - Expression we check for true or false
     * @param {*} failMessage - Error emssage to display on fail
     */
    assertAreEqual(obj1, obj2, failMessage) {
        this.assert(obj1 == obj2, failMessage);
    }

    /**
     * If the first two parameters are strictly equivalent, this is a pass. Otherwise, add the fail message to the fails array
     * 
     * @param {*} expression - Expression we check for true or false
     * @param {*} failMessage - Error emssage to display on fail
     */
    assertAreEqualStrict(obj1, obj2, failMessage) {
        this.assert(obj1 === obj2, failMessage);
    }

    /**
     * If the function throws an error, the test passed as it was expected. Otherwise, add the fail message to the fails array
     * 
     * @param {*} expression - Expression we check for true or false
     * @param {*} failMessage - Error emssage to display on fail
     */
    assertFail(failFunction, failMessage) {
        try {
            failFunction();
        } catch(e) {
            if (!this.passes[this.segmentName]) {
                this.passes[this.segmentName] = 0;
            }
            this.passes[this.segmentName]++;
            return;
        }
        if (!this.fails[this.segmentName]) {
            this.fails[this.segmentName] = [];
        }
        this.fails[this.segmentName].push(this.segmentName + ":: " + failMessage);
    }
    
    /**
     * Switches segments as a new grouping of tests is being run
     */
    newSegment(segmentName) {
        this.segments.push(segmentName);
        this.segmentName = segmentName;
    }

    /**
     * Switches segments to go back to an existing group
     */
    switchSegment(segmentName) {
        let oldSegment = this.segmentName;
        this.segmentName = segmentName;
        return oldSegment;
    }

    /**
     * Lets the execution of asserts occur after a function leaves, when an asynchronous
     * callback tries to pass/fail a test after the fact.
     */
    runAssertsFromAsync(functionToInvoke, segmentName) {
        let oldSegment = this.switchSegment(segmentName);
        functionToInvoke();
        this.switchSegment(oldSegment);
    }

    /**
     * Logs the unit tests based on the current state
     */
    logState() {
        let failedSegments = Object.keys(this.fails);
        let passedSegments = Object.keys(this.passes);

        let failed = failedSegments.length > 0;
        let passed = failedSegments.length == 0 && passedSegments.length > 1;
        let totalUnitTests = failedSegments.length + passedSegments.length;

        if (passed) {
            console.log("## Passed All " + totalUnitTests + " Unit Tests");
        } else if (failed) {
            console.log("## Unit Tests failed");
            console.log("## Passed " + passedSegments.length + " / " + totalUnitTests + " Unit Tests");
            console.log("## Failed Tests...");
            for(let i = 0; i < failedSegments.length; i++) {
                console.info("# " + (i+1) + ":", this.fails[failedSegments[i]][0]);
            }

        } else {
            console.info("## No Tests Were Ran");
        }
    }
}