const moduleExporter = require("./module.js");

/**
 * Name: 
 *      Seed
 * 
 * Description:
 *      The cryptocurrency of the Seed ecosystem.
 * 
 *      The cryptocurrency's design & implementation is based on the Ethereum ERC-20 Standard
 * 
 * State Changing Functions:
 *      transfer(to, amount)
 *      transferFrom(from, to, amount)
 *      approve(spender, amount)
 *      
 * Getters:
 *      getBalanceOf(owner)
 *      getAllowance(owner, spender)
 *      getTotalSupply()
 *      getSymbol()
 *      getDecimals()
 *      
 *  Module-Data:
 *      totalSupply : number
 *      symbol : string
 *      decimals : number
 * 
 *  User-Data:
 *      balance : number
 *      allowance : { string : number }
 */

 let seedModule = null;

module.exports = {
    getSeed : function() {
        if (seedModule == null) {
            seedModule = moduleExporter.createModule({
                module : "Seed", 
                data : initialSeedState,
                initialUserData : initialUserState
            });

            console.info(constructor);

            seedModule.addFunctions({
                constructor : constructor,
                transfer : transfer,
                transferFrom : transferFrom,
                approve : approve,
                burn : burn,
                getBalanceOf : getBalanceOf,
                getAllowance : getAllowance,
                getTotalSupply : getTotalSupply,
                getSymbol : getSymbol,
                getDecimals : getDecimals
            });
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
 * Constructor for the Seed module, called upon creation.
 * 
 * args:
 *      initialSeed - Initial amount of SEED to give to the creator
 * 
 * changes:
 *      Increase "Sender" balance
 *      Increase totalSupply
 * 
 * For testing purposes, initially gives SEED to the creator
 * 
 * @param {*} container - Container object that holds read-only data.
 * @param {*} changeContext  - Write-Only object to hold changes to module and userData state
 */
let constructor = function(container, changeContext) {
    let sender = container.sender;
    let initialSeed = container.args.initialSeed;

    changeContext.add(initialSeed, { user : sender, key : "balance" });
    changeContext.add(initialSeed, { key : "totalSupply" });

    return changeContext;
}

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
         changeContext.subtract(value, { user : from, outerKey : "allowance", innerKey : sender });
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

    let dif = value - (currentApproval != undefined ? currentApproval : 0); 

    if (dif > 0) {
        changeContext.add(dif, { user : container.sender, outerKey : "allowance", innerKey : spender });
    } else if (dif < 0) {
        changeContext.subtract(dif, { user : container.sender, outerKey : "allowance", innerKey : spender });
    }

    return changeContext;
}

/**
 * The sender burns value worth of SEED coin, removing it from circulation
 * 
 * args:
 *      value - How much SEED to burn
 * 
 * changes:
 *      Decreases "sender" balance by value
 *      Decreases "totalSupply" by value
 * 
 * @param {*} container - Container object that holds read-only data
 * @param {*} changeContext - Write-Only object to hold changes to module and userData state
 */
let burn = function(container, changeContext) {
    //Gather readonly data
    let value = container.args.value;
    let balance = container.getUserData("Seed", container.sender).balance;

    if (balance >= value) {
        changeContext.subtract(value, { user : container.sender, key : "balance" });
        changeContext.subtract(value, { key : "totalSupply" });
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
let getBalanceOf = function(container) {
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
let getAllowance = function(container) {
    return container.getUserData("Seed", container.args.owner).allowance[container.args.spender];
}

/**
 * Gets the total amount of SEED in circulation
 * 
 * args:
 *      N/A
 * 
 * @param {*} container - Container object that holds read-only data
 */
let getTotalSupply = function(container) {
    return container.getModuleData("Seed").totalSupply;
}

/**
 * Gets the symbol, "SEED"
 * 
 * args: N/A
 * 
 * @param {*} container - Container object that holds read-only data
 */
let getSymbol = function(container) {
    return container.getModuleData("Seed").symbol;
}

/**
 * Gets the amount of decimals used when displaying seed
 * 
 * args: N/A
 * 
 * @param {*} container - Container object that holds read-only data
 */
let getDecimals = function(container) {
    return container.getModuleData("Seed").decimals;
}
