const moduleExporter = require("../../../seedSrc/module.js");

/**
 * Name: 
 *      Relay
 * 
 * Description:
 *      A simple module which handles transaction which are for the sole purpose of validating as many
 *      as possible.
 * 
 *      In the future, it will include logic around users voting to block certain relay nodes that others
 *      claim are malicious.
 *      
 * State Changing Functions:
 *      relay()
 *      
 * Getters:
 *      validatedTransactions()
 *      
 *  Module-Data:
 *      totalRelays : number
 *      
 *  User-Data:
 *      relays : number
 */

 let relayModule = null;

module.exports = {
    getModule : function() {
        if (relayModule == null) {
            relayModule = moduleExporter.createModule({
                module : "Relay", 
                initialData : initialRelayState,
                initialUserData : initialUserState,
                functions : {
                    constructor : constructor,
                    relay : relay
                }
            });
        }
        return relayModule;
    }
 }

/*  ### Seed's Initial Variable State ### */
let initialRelayState = { 
    totalRelays : 0, // Total count of relays done
}

/*  ### Each Seed User's Initial Variable State ### */
let initialUserState = {
    relays : 0, // A users relay count
}

/*  
    ################################
    ### State Changing Functions ###
    ################################ 
*/

/**
 * Constructor for the Relay module, called upon creation.
 * 
 * args:
 * 
 * changes:
 * 
 * @param {*} container - Container object that holds read-only data.
 * @param {*} changeContext  - Write-Only object to hold changes to module and userData state
 */
let constructor = function(container, changeContext) {
    return changeContext;
}

/**
 * Relay function called when users are strictly relaying a transaction in order to validate other users
 * 
 * args:
 * 
 * changes:
 *      Increases users' "relays" value
 *      Increases total "relays" value
 * 
 * @param {Container} container - Container object that holds read-only data
 * @param {ChangeContext} changeContext - Write-Only object to hold changes to module and userData state
 */
let relay = function(container, changeContext) {
    // Gather readonly data
    let sender = container.sender;
    let relaysToAdd = container.txHashes.length;

    // Confirm adequate balance for the transaction
    if (relaysToAdd > 0) {
         changeContext.add(relaysToAdd, {user : sender, key : "relays"});
         changeContext.add(relaysToAdd, { key : "totalRelays"} );
    }

    return changeContext;
}

/*  
    #########################
    ### Read-Only Getters ###
    #########################
*/

/**
 * Gets the current Relays count of a user
 * 
 * args:
 *      owner - Who's relay count we are getting
 * 
 * @param {*} container - Container object that holds read-only data
 */
let getTotalRelays = function(container) {
    return container.getModuleData().totalRelays;
}

/**
 * Gets the current Relays count of a user
 * 
 * args:
 *      owner - Who's relay count we are getting
 * 
 * @param {*} container - Container object that holds read-only data
 */
let getRelays = function(container) {
    return container.getUserData(container.args.owner).relays;
}
