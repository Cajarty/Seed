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
        return (this.nextInt() - 1) / 2147483646;
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
        let initialSeed = 123;
        let random = module.exports.createRandom(initialSeed);
        test.assertAreEqual(random.seed, initialSeed, "The Random's seed value was not what was passed in");

        test.assert(random.nextInt(), 2067261, "Via seed 123, the first random int should be 2067261");
        test.assert(random.nextInt(), 384717275, "Via seed 123, the second random int should be 384717275");
        test.assert(random.nextInt(), 2017463455, "Via seed 123, the third random int should be 2017463455");
    },
    /**
     * Randomness falls under a valid distribution.
     */
    random_randomnessFallsUnderValidDistributions : function(test, log) {
        let runsPerSeed = 10000;

        let seeds = [
            0, 1, -1, 123, 12341234, -8345345, 2147483647, 4234234, 523452345, 12312314
        ]

        // Map out the distribution, where "1" means "<0.1", 5 means "<0.5" and "10" means "<=1"
        let distribution = {
            "<0.1" : 0,
            "<0.2" : 0,
            "<0.3" : 0,
            "<0.4" : 0,
            "<0.5" : 0,
            "<0.6" : 0,
            "<0.7" : 0,
            "<0.8" : 0,
            "<0.9" : 0,
            "<=1.0" : 0
        }

        // Add random values from 0 to 1 to the distribution, seperated into 10 categories
        log("Over 10 seeds, invoke total of 100,000 random calls, and mapping distribution into 10 buckets")
        for(let i = 0; i < seeds.length; i++) {
            let seed = seeds[i];
            let random = module.exports.createRandom(seed);
            for(let j = 0; j < runsPerSeed; j++) {
                let value = random.nextFloat();
                let distributionToIncrease = 0;
                if (value < 0.1) {
                    distributionToIncrease = "<0.1";
                } else if (value < 0.2) {
                    distributionToIncrease = "<0.2";
                } else if (value < 0.3) {
                    distributionToIncrease = "<0.3";
                } else if (value < 0.4) {
                    distributionToIncrease = "<0.4";
                } else if (value < 0.5) {
                    distributionToIncrease = "<0.5";
                } else if (value < 0.6) {
                    distributionToIncrease = "<0.6";
                } else if (value < 0.7) {
                    distributionToIncrease = "<0.7";
                } else if (value < 0.8) {
                    distributionToIncrease = "<0.8";
                } else if (value < 0.9) {
                    distributionToIncrease = "<0.9";
                } else if (value <= 1) {
                    distributionToIncrease = "<=1.0";
                }
                distribution[distributionToIncrease]++;
            }
        }

        // Determine the variance of the distributions
        let highest = -10000000;
        let lowest = 10000000;
        let median = 0;
        for(let i = 0; i < Object.keys(distribution).length; i++) {
            let key = Object.keys(distribution)[i];
            if (distribution[key] > highest) {
                highest = distribution[key];
            } else if (distribution[key] < lowest) {
                lowest = distribution[key];
            }
            median += distribution[key];
        }
        median /= 10;

        // 5% of median value is limited variance
        let allowedVariance = median * 0.05; 
        
        log("Highest Distributed Value: ", highest);
        test.assert(Math.abs(highest - median) < allowedVariance, "The highest distributon in Pseudo-randomness was above allowed variance");
        log("Lowest Distributed Value: ", lowest);
        test.assert(Math.abs(median - lowest) < allowedVariance, "The lowest distributon in Pseudo-randomness was above allowed variance");
        log("Distribution of random values", distribution);
    }
}