const moduleExporter = require("./module.js");

/**
 * Name: 
 *      Seed Module
 * 
 * Description:
 *      The cryptocurrency of the Seed ecosystem. This base implementation is inspired by the Ethereum ERC20 standard
 * 
 */

 let seedModule = null;

 let createSeedModule = function() {
    let newSeedModule = moduleExporter.createModule({
        module : "Seed", 
        version : "1",
        data : initialSeedState,
        initialUserData : initialUserState
    });

    return newSeedModule;
 }

module.exports = {
    getSeed : function() {
        if (seedModule == null) {
            seedModule = createSeedModule();
        }
        return seedModule;
    } 
 }

/*  ### Seed's Initial Variable State ### */
let initialSeedState = { 
    totalSupply : 0, // Total supply of SEED in circulation
    symbol : "SEED", // Symbol of SEED cryptocurrency for UI's
    decimals : 4 // Amount of decimals used when displaying the SEED cryptocurrency. Maximum divisible amount
}

/*  ### Each Seed User's Initial Variable State ### */
let initialUserState = {
    balance : 0, // A users SEED balance
    allowance : {} // How much SEED a given user allows other users to spend on their behalf
}

/*  
    ################################
    ### State Changing Functions ###
    ################################ 
*/

/**
 * Transfer funds from a user to another user
 * 
 * args:
 *      to - Who to send SEED to
 *      value - How much SEED to send
 * 
 * changes:
 *      Decrease "sender" balance
 *      Increase "to" balance
 * 
 * @param {Container} container - Container object that holds read-only data.
 *      Used to grab the arguments regarding who is sending SEED, who to send to, and how much
 *      Used to access the user data to get balance
 * @param {ChangeContext} changeContext - Write-Only object to hold changes to module and userData state
 */
let transfer = function(container, changeContext) {
    // Gather readonly data
    let to = container.args.to;
    let value = container.args.value;
    let sender = container.sender;
    let fromBalance = container.getUserData("Seed", sender).balance;

    // Confirm adequate balance for the transaction
    if (fromBalance >= value && value > 0) {
         changeContext.subtract(value, {user : sender, key : "balance"});
         changeContext.add(value, { user : to, key : "balance"} );
    }

    return changeContext;
}

/**
 * Transfer funds from user "from" to user "to" on the sender behalf based on "from" users given allowance to "sender" user
 * 
 * args:
 *      to - Who to send SEED to
 *      from - On who's behalf is the sender spender the SEED of
 *      value - How much SEED to send
 * 
 * changes:
 *      Decrease "from" balance
 *      Decrease "from"-"sender" allowance
 *      Increase "to" balance
 * 
 * @param {Container} container - Container object that holds read-only data.
 *      Used to grab the arguments regarding on who's behalf the sender is sending SEED, who to send to, and how much
 *      Used to access the user data to get balance and allowance amount
 * @param {ChangeContext} changeContext - Write-Only object to hold changes to module and userData state
 */
let transferFrom = function(container, changeContext) {
    // Gather readonly data
    let to = container.args.to;
    let from = container.args.from;
    let value = container.args.value;
    let sender = container.sender;
    let fromBalance = container.getUserData("Seed", from).balance;
    let senderAllowance = container.getUserData("Seed", from).allowance[sender];

    // Confirm adequate balance and allowance for the transaction
    if (fromBalance >= value && senderAllowance >= value && value > 0) {
         changeContext.subtract(value, { user : from, key : "balance" });
         changeContext.subtract(value, { user : "from", outerKey : "allowance", innerKey : sender });
         changeContext.add(value, { user : to, key : "balance" });
    }
    
    return changeContext;
}

/**
 * The sender approves an allowance for the spender of a set amount, allowing the spender to spend on the senders behalf.
 * 
 * args:
 *      spender - Who is receiving an allowance on the Senders behalf
 *      value - How much SEED is the allowance for
 * 
 * changes:
 *      Increases/Decreases "sender"-"spender" allowance
 * 
 * @param {*} container - Container object that holds read-only data
 *          Used to grab arguments regarding who is giving an allowance, who is receiving the allowance, and how much the allowance is for
 * @param {*} changeContext - Write-Only object to hold changes to module and userData state
 */
let approve = function(container, changeContext) {
    //Gather readonly data
    let spender = container.args.spender;
    let value = container.args.value;
    let currentApproval = container.getUserData("Seed", container.sender).allowance[spender];

    let dif = value - currentApproval; 

    if (dif > 0) {
        changeContext.add(dif, { user : container.sender, outerKey : "allowance", innerKey : spender });
    } else if (dif < 0) {
        changeContext.subtract(dif, { user : container.sender, outerKey : "allowance", innerKey : spender });
    }

    return changeContext;
}

/*  
    #########################
    ### Read-Only Getters ###
    #########################
*/

/**
 * Gets the current SEED balance of a user
 * 
 * args:
 *      owner - Who's SEED balance we are getting
 * 
 * @param {*} container - Container object that holds read-only data
 */
let balanceOf = function(container) {
    return container.getUserData("Seed", container.args.owner).balance;
}

/**
 * Gets the current SEED allowance of a spender for a given owner
 * 
 * args:
 *      owner - Who's SEED the allowance spends from
 *      spender - Who has the allowance that can spend the owners SEED
 * 
 * @param {*} container - Container object that holds read-only data
 */
let allowance = function(container) {
    return container.getUserData("Seed", container.args.owner).allowance[container.args.spender];
}