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

 const cryptoExporter = require("../cryptoHelper.js");

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
        let bigString = "";
        for(let i = 0; i < hashes.length; i++) {
            bigString = bigString.concat(hashes[i]);
        }
        return cryptoExporter.newCryptoHelper().fastStringHashCode(bigString);
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