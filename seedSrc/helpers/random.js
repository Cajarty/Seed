/*************
 * random.js *
 *************
 * 
 * Exports functions required for the deterministic pseudo-randomness.
 * 
 * All functions used here must be used with caution. Due to it being deterministic, users may be able to control the randomness to an extent.
 * 
 * Logic taken from gist: https://gist.github.com/blixt/f17b47c62508be59987b, then reworked and wrapped to fit our design
 * 
 */

 const cryptoExporter = require("./cryptoHelper.js");

module.exports = {
    /**
     * Creates a new Random object which can have a nextInt/nextFloat randoms taken from it
     * 
     * @param {Integer} startingSeed - The new seed to give the 
     */
    createRandom : function(startingSeed) {
        return new Random(startingSeed);
    },
    /**
     * Generates a "seed" to feed into our randomness from an array of hashes in the form of strings.
     */
    generateSeedFromHashes : function(hashes) {
        if (!hashes || hashes.length == 0) {
            throw "Generating a seed from hashes must have an array of string hashes as input. At least 1 hash";
        }
        let bigString = "";
        for(let i = 0; i < hashes.length; i++) {
            bigString = bigString.concat(hashes[i]);
        }
        return cryptoExporter.newCryptoHelper().fastStringHashCode(bigString);
    },
    getUnitTests : function() {
        return randomUnitTests;
    }
 }


/**
 * Creates a pseudo-random value generator. The seed must be an integer.
 *
 * Uses an optimized version of the Park-Miller PRNG.
 * http://www.firstpr.com.au/dsp/rand31/
 */
class Random {
    constructor(newSeed) {
        this.seed = newSeed % 2147483647;
        if (this.seed <= 0) {
            this.seed += 2147483646
        };
    }

    /**
     * Returns a pseudo-random value between 1 and 2^32 - 2.
     */
    nextInt() {
        return this.seed = this.seed * 16807 % 2147483647;
    }

    /**
     * Returns a pseudo-random floating point number in range [0, 1).
     */
    nextFloat() {
        // We know that result of next() will be 1 to 2147483646 (inclusive).
        return (this.next() - 1) / 2147483646;
    }
}

const randomUnitTests = {
    /**
     * Generates the proper Seed out of passed in hashes.
     */
    seedFromHashes_generatesProperSeedFromHashes : function(test, log) {
        let initialSeed = 123;
        let random = module.exports.createRandom(initialSeed);
        test.assertAreEqual(random.seed, initialSeed, "The Random's seed value was not what was passed in");
    },
    /**
     * Throws an error message upon passing in undefined input into seeding generation.
     */
    seedFromHashes_throwsForUndefinedInput : function(test, log) {
        test.assertFail(() => {
            module.exports.generateSeedFromHashes(undefined);
        }, "Expected undefined into into Random creation to throw error");
    },
    /**
     * Throws an error message upon passing in a empty array as input into seeding generation.
     */
    seedFromHashes_throwsForUEmptyInput : function(test, log) {
        test.assertFail(() => {
            module.exports.generateSeedFromHashes([]);
        }, "Expected undefined into into Random creation to throw error");
    },
    /**
     * Generates expected pseudo random values based on passed in seed.
     */
    random_generatesRandomValueBasedOnSeed : function(test, log) {
        test.assert(false, "Test Not Implemented");
    },
    /**
     * Randomness falls under a valid distribution.
     */
    random_randomnessFallsUnderValidDistributions : function(test, log) {
        test.assert(false, "Test Not Implemented");
    }
}