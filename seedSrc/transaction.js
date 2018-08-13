/******************
 * transaction.js *
 ******************
 * 
 * Exports the creation of transactions, as well as helper functions related to transaction validation,
 * and re-testing transactions for validation once dependant transactions become validated.
 * 
 * Exported Functions:
 *      createNewTransaction(sender, execution, trustedTransactions ) 
 *          - Creates a new transaction object
 *      createExistingTransaction(sender, execution, trustedTransactions, transactionHash, transactionSignature )
 *          - Creates a new transaction object based on an existing transactions data
 *      isTransactionValid(transaction)
 *          - Determines if the transaction is considered valid or not
 *      isTransactionProper(transaction) 
 *          - Determines if the transaction is "Proper", meaning well-formed with its validated transactions being proper as well
 *      notifyTransactionValidation(transactionHash)
 *          - Notifies all Proper transactions awaiting Validation that transactionHash is now valid, therefore retest if we were dependant on it
 *      waitToBeNotified(transaction)
 *          - A Proper transaction starts awaiting for its dependant transactions to be validated. Will be retested upon "notifyTransactionValidation" being invoked
 *      createTransactionValidator()
 *          - Creates a new transaction validator
 * 
 * IMPORTANT NOTES:
 *      "Proper"
 *      - A transaction is Proper if it meets all rules regarding being well-formed, except does not yet pass Rule #10
 *      "Valid"
 *      - A transaction is Valid if it is "Proper" and also meetes Rule #10
 * 
 *      Breaking Rule #4 may mean its too new or too old. It can still be "Proper", we just can't validate it as we have an incomplete picture
 */

module.exports = {
    /**
     * Creates a new transaction, signs it and returns it.
     * 
     * @param sender - The sending address creating the new transaction
     * @param execution - The Execution object to be assigned relating to "what this transaction did"
     * @param trustedTransactions - And array of transaction hashes and work done that this transactions deems valid
     * 
     * @return - Returns a new transaction based on the given data
     */
    createNewTransaction : function(sender, execution, trustedTransactions ) {
        let cryptoHelper = cryptoExporter.newCryptoHelper();
        let svm = svmExporter.getVirtualMachine();

        let moduleUsed = svm.getModule({ module : execution.moduleName });

        if (moduleUsed != undefined) {
            execution.functionChecksum = moduleUsed.functionChecksums[execution.functionName];
            execution.moduleChecksum = moduleUsed.moduleChecksum;

            var transaction = new Transaction(sender, execution, trustedTransactions);
            transaction.updateHash();
            return transaction;
        } else {
            throw new Error("Error creating new transaction. Module used not found");
        }
        return undefined;
    },
    /**
     * Creates a new transaction out of purely existing data
     * 
     * @param sender - The sending address creating the new transaction
     * @param execution - The Execution object to be assigned relating to "what this transaction did"
     * @param trustedTransactions - And array of transaction hashes and work done that this transactions deems valid
     * @param transactionHash - The hash of the existing transaction
     * @param transactionSignature - The signature by the sender which signed the transactionHash
     * 
     * @return - Returns a new transaction created from existing data
     */
    createExistingTransaction : function(sender, execution, trustedTransactions, transactionHash, transactionSignature ) {
        let cryptoHelper = cryptoExporter.newCryptoHelper();
        let svm = svmExporter.getVirtualMachine();

        let moduleUsed = svm.getModule({ module : execution.moduleName });

        if (moduleUsed != undefined) {
            let functionHash = moduleUsed.functionHashes[execution.functionName];
            if (functionHash != undefined) {
                execution.moduleChecksum = cryptoHelper.hashToChecksum(moduleUsed.fullHash());
                execution.functionChecksum = cryptoHelper.hashToChecksum(functionHash);

                return new Transaction(sender, execution, trustedTransactions, transactionHash, transactionSignature);
            } else {
                throw new Error("Error creating new transaction. Function used not found");
            }
        } else {
            throw new Error("Error creating new transaction. Module used not found");
        }
        return undefined;
    },
    /**
     * Determines whether a transaction is considered valid or not.
     * 
     * @param transaction - The transaction being tested
     * 
     * @return - True or false regarding whether the transaction is valid or not
     */
    isTransactionValid: function(transaction) {
        let validator = new TransactionValidator();
        return isValid(transaction, validator);
    },
    /**
     * Determines whether a transaction is considered proper or not
     * 
     * @param transaction - The transaction being tested
     * 
     * @return - True or false regarding whether the transaction is proper or not
     */
    isTransactionProper : function(transaction) {
        let validator = new TransactionValidator();
        return isProper(transaction, validator);
    },
    /**
     * Notifies "Proper" transaction awaiting validation that a transaction has just been validated. Therefore, if a Proper transaction is
     * dependant on the transactionHash for validation, it will be re-tested and potentially approved.
     * 
     * @param transactionHash - The hash of a transaction which has just been validated
     */
    notifyTransactionValidation : function(transactionHash) {
        if (validCheckWaiting[transactionHash]) {
            for(let i = 0; i < validCheckWaiting[transactionHash].length; i++) {
                let toCheck = validCheckWaiting[transactionHash][i];
                toCheck.checksLeft--;
                if (toCheck.checksLeft == 0) {
                    entanglementExporter.incomingTransaction(toCheck.transaction);
                }
            }
        }
    },
    /**
     * Takes a "Proper" transaction and has it wait on all dependant "Proper" transactions. Once one of these dependant transactions becomes valid,
     * the passed in transaction can then be retested for validation.
     * 
     * @param transaction - The transaction to wait for dependant transactions to be validated
     */
    waitToBeNotified : function(transaction) {
        let validateCheck = { transaction : transaction.transaction, checksLeft : 0 }
        for(let i = 0; i < transaction.validatedTransactions.length; i++) {
            let toBeValidatedHash = transaction.validatedTransactions[i].transactionHash;
            if (!entanglementExporter.isValid(toBeValidatedHash)) {
                if (!validCheckWaiting[toBeValidatedHash]) {
                    validCheckWaiting[toBeValidatedHash] = [];
                }
                validCheckWaiting[toBeValidatedHash].push(validateCheck);
                validateCheck.checksLeft++;
            }
        }
    },
    /**
     * @return - A new transaction validator
     */
    createTransactionValidator: function() {
        return  new TransactionValidator();
    }
 }

 const cryptoExporter = require("./helpers/cryptoHelper.js");
 const svmExporter = require("./virtualMachine/virtualMachine.js");
 const accountExporter = require("./account.js");
 const conformHelper = require("./helpers/conformHelper.js");
 const entanglementExporter = require("./entanglement.js");

 /**
  * Helper function used by exporter and Validator object. Determines whether the passed in transaction is proper or not.
  * A transaction is "Proper" if it passes every rule other than Rule #10.
  *
  * @param {*} transaction - The transaction to check
  * @param {*} validator - A validator object to use for testing
  *
  * @return - True or false regarding whether the transaction is Proper or not
  */
 let isProper = function(transaction, validator) {
    //Prove the Transaction.Sender, Transaction.Execution and Transaction.ValidatedTransactions are the content that creates the Transaction.TransactionHash
    let rule1 = validator.doesFollowRule1(transaction);

    //Prove that the Transaction.Sender is a valid public key, and therefore was derived from a valid private key
    let rule2 = validator.doesFollowRule2(transaction);

    //Prove that the Transaction.Sender is the public key consenting to the transaction
    let rule3 = validator.doesFollowRule3(transaction);

    //Prove that the Transaction.ValidatedTransactions is using verifiable data that other users have verified, while still being new-enough that its in the DAG still. If we don't have these Hash's, this is an indicator that
    //we may have differing versions of history, OR that we simply do not know of these transactions yet
    let rule4 = validator.doesFollowRule4(transaction);

    //Prove that this new Transaction and its validate transactions do not create a cycle in the DAG
    let rule5 = validator.doesFollowRule5(transaction);

    //Prove that we agree on the module code being executed, so we're using the same versions
    let rules6And7 = validator.doesFollowRules6And7(transaction)

    //Prove that, when we simulate the execution, we get the same ChangeSet (Prove their statement of change was right)
    let rule8 = validator.doesFollowRule8(transaction);

    //Prove that their Transaction.ValidatedTransactions.ChangeSets aggree with the transactions they're validatings results.
    //NOTE: If they didn't agree, they shouldn't have mentioned them. We only submit validated transactions we agree with. Ones we disagree with are simply ignored, never referenced, and therefore never validated
    let rule9 = validator.doesFollowRule9(transaction);

    let rule11 = validator.doesFollowRule11(transaction);

    let result = rule1 && rule2 && rule3 && rule4 && rule5 && rules6And7 && rule8 && rule9 && rule11;

    if (!result) {
        console.info("isTransactionValid Failed", rule1, rule2, rule3, rule4, rule5, rules6And7, rule8, rule9, rule10, rule11);
    }

    return result;
 }

 /**
  * Helper function used by exporter and Validator object. Determines whether the passed in transaction is valid or not.
  * A transaction is "Valid" if it passes every rule, i.e. is Proper and passes Rule #10
  *
  * @param {*} transaction - The transaction to check
  * @param {*} validator - A validator object to use for testing
  *
  * @return - True or false regarding whether the transaction is Valid or not
  */
 let isValid = function(transaction, validator) {
    let rule10 = validator.doesFollowRule10(transaction);
    return isProper(transaction, validator) && rule10;
}

// Proper transactions waiting to be rechecked for pending validity
 let validCheckWaiting = {};

 /**
  * Encompasses the logic regarding the 11 rules a transaction must pass to be considered Valid
  */
class TransactionValidator {
    /**
     * Prove the Transaction.Sender, Transaction.Execution and Transaction.ValidatedTransactions are the content that creates the Transaction.TransactionHash
     * 
     * @param {*} transaction - Transaction to test
     * 
     * @return - True or false regarding if the check passes
     */
    doesFollowRule1(transaction) {
        let dataToHash = transaction.getHashableData();
        let cryptoHelper = cryptoExporter.newCryptoHelper();
        let hash = cryptoHelper.sha256(dataToHash);
        return hash == transaction.transactionHash;
    }

    /**
     * Prove that the Transaction.Sender is a valid public key, and therefore was derived from a valid private key
     * 
     * @param {*} transaction - Transaction to test
     * 
     * @return - True or false regarding if the check passes
     */
    doesFollowRule2(transaction) {
        let cryptoHelper = cryptoExporter.newCryptoHelper();
        return cryptoHelper.isPublicKeyValid(transaction.sender);
    }

    /**
     * Prove that the Transaction.Sender is the public key consenting to the transaction
     * 
     * @param {*} transaction - Transaction to test
     * 
     * @return - True or false regarding if the check passes
     */
    doesFollowRule3(transaction) {
        let account = accountExporter.newAccount( { publicKey : transaction.sender, network : "00" });
        return account.verifySignature(transaction.signature, transaction.transactionHash);
    }

    
    /**
     * Prove that the Transaction.ValidatedTransactions is using verifiable data that other users have verified, while still being new-enough that its in the DAG still. 
     * If we don't have these Hash's, this is an indicator that we may have differing versions of history, OR that we simply do not know of these transactions yet
     * 
     * @param {*} transaction - Transaction to test
     * 
     * @return - True or false regarding if the check passes
     */
    doesFollowRule4(transaction) {
        for(let i = 0;  i < transaction.validatedTransactions.length; i++) {
            if (!entanglementExporter.hasTransaction(transaction.validatedTransactions[i].transactionHash)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Prove that this new Transaction and its validate transactions do not create a cycle in the DAG
     * 
     * @param {*} transaction - Transaction to test
     * 
     * @return - True or false regarding if the check passes
     */
    doesFollowRule5(transaction) {
        return !entanglementExporter.doesTransactionCauseCycle(transaction);
    }

    /**
     * Prove that we agree on the module code being executed, so we're using the same versions
     * 6) The Transaction.Execution.ModuleName and Transaction.Execution.ModuleChecksum matches the version of the module we're using
     * 7) The Transaction.Execution.FunctionName and Transaction.Execution.FunctionChecksum matches the version of the function we're using
     * 
     * @param {*} transaction - Transaction to test
     * 
     * @return - True or false regarding if the check passes
     */
    doesFollowRules6And7(transaction) {
        let cryptoHelper = cryptoExporter.newCryptoHelper();
        let svm = svmExporter.getVirtualMachine();

        let moduleUsed = svm.getModule({ module : transaction.execution.moduleName });

        if (moduleUsed != undefined) {
            let functionHash = moduleUsed.functionHashes[transaction.execution.functionName];
            if (functionHash != undefined) {
                let moduleChecksum = cryptoHelper.hashToChecksum(moduleUsed.fullHash());
                let functionChecksum = cryptoHelper.hashToChecksum(functionHash);
                return transaction.execution.moduleChecksum == moduleChecksum && transaction.execution.functionChecksum == functionChecksum;
            }
        }
        return false;
    }

    
    /**
     * Prove that, when we simulate the execution, we get the same ChangeSet (Prove their statement of change was right)
     * 8) SVM.Simulate(Transaction.Execution) == Transaction.Execution.ChangeSet
     * 
     * @param {*} transaction - Transaction to test
     * 
     * @return - True or false regarding if the check passes
     */
    doesFollowRule8(transaction) {
        let svm = svmExporter.getVirtualMachine();
        let functionToInvoke = svm.getModule({ module : transaction.execution.moduleName }).getFunctionByName(transaction.execution.functionName);
        let txHashes = [];
        for(let i = 0; i < transaction.validatedTransactions.length; i++) {
            txHashes.push(transaction.validatedTransactions[i].transactionHash);
        }
        let simulationInfo = { 
            module : transaction.execution.moduleName, 
            function : transaction.execution.functionName, 
            args : transaction.execution.args, 
            user : transaction.sender, 
            txHashes :  txHashes
        }
        let result = JSON.stringify(svm.simulate(simulationInfo));

        return result == transaction.execution.changeSet;
    }

    
    /**
     * Prove that their Transaction.ValidatedTransactions.ChangeSets aggree with the transactions they're validatings results.
     * NOTE: If they didn't agree, they shouldn't have mentioned them. We only submit validated transactions we agree with. 
     * Ones we disagree with are simply ignored, never referenced, and therefore never validated
     * 9) foreach Transaction.ValidatedTransactions { SVM.DoesChangeSetMatch(ValidatedTransaction.Hash, ValidatedTransaction.ChangeSet) }
     * 
     * @param {*} transaction - Transaction to test
     * 
     * @return - True or false regarding if the check passes
     */
    doesFollowRule9(transaction) {
        let entanglement = entanglementExporter.getEntanglement();
        for(let i = 0; i < transaction.validatedTransactions.length; i++) {
            let transactionInDAG = entanglement.getTransaction(transaction.validatedTransactions[i].transactionHash);
            if (transactionInDAG != undefined) {
                if (transaction.validatedTransactions[i].changeSet != transactionInDAG.execution.changeSet) {
                    return false;
                }
            } else {
                throw new Error("All transactions being validated must exist");
                return false;
            }
        }
        return true;
    }

    /**
     * Prove that, when we simulate the execution of their validated transactions, their execution was also right (Prove their "work" was right).
     * 10) SVM.WaitForValidation(Transaction.ValidatedTransactions, simulateTrustedParent : Transaction.Hash)
     * 
     * @param {*} transaction - Transaction to test
     * 
     * @return - True or false regarding if the check passes
     */
    doesFollowRule10(transaction) {
        let trusted = true
        let validateCheck = { transaction : transaction.transactionHash, checksLeft : 0 }
        for(let i = 0; i < transaction.validatedTransactions.length; i++) {
            let toBeValidatedHash = transaction.validatedTransactions[i].transactionHash;
            if (!entanglementExporter.isValid(toBeValidatedHash)) {
                trusted = false;
            }
        }
        return trusted;
    }

    /**
     * You cannot validate other transactions owned by yourself
     * 
     * @param {*} transaction - Transaction to test
     * 
     * @return - True or false regarding if the check passes
     */
    doesFollowRule11(transaction) {
        for(let i = 0; i < transaction.validatedTransactions.length; i++) {
            let transactionValidated = entanglementExporter.getEntanglement().transactions[transaction.validatedTransactions[i].transactionHash];
            if (transactionValidated.sender == transaction.sender) {
                return false;
            }
        }
        return true;
    }
}

/**
 * Class describing a "Transaction" in Seed
 * 
 * Transaction Schema:
 *      Transaction Hash
 *      Sender Address
 *      Execution:
 *          ModuleName
 *          FunctionName
 *          Arguments
 *          ModuleChecksum
 *          FunctionChecksum
 *          ChangeSet
 *      Trusted Transactions:
 *          Transaction Hash
 *          Module Checksum
 *          Function Checksum
 *          ChangeSet
 *      Signature
 */
class Transaction {
    /**
     * Constructor for a transaction, taking in all information needed to be a well formed transaction
     * 
     * @param {*} sender - Creator of the transaction
     * @param {*} execution - The changes that were done by the transaction
     * @param {*} trustedTransactions - Validation info regarding what this transaction deemed valid as work
     * @param {*} transactionHash - The hash of this transaction information
     * @param {*} signature - A cryptographic signature between the sender and the transactionHash
     */
    constructor(sender, execution, trustedTransactions, transactionHash, signature) {
        this.transactionHash = transactionHash;
        this.sender = sender;
        this.execution = {
            moduleName : execution.moduleName,
            functionName : execution.functionName,
            args : execution.args,
            moduleChecksum: execution.moduleChecksum,
            functionChecksum : execution.functionChecksum,
            changeSet : execution.changeSet
        };
        this.validatedTransactions = trustedTransactions;
        this.signature = signature;
    }

    /**
     * Recalcualtes the transaction hash based on the internal hashable data
     */
    updateHash() {
        let cryptoHelper = cryptoExporter.newCryptoHelper();
        this.transactionHash = cryptoHelper.sha256(this.getHashableData());
    }

    /**
     * Rebuilds the data into a long string that can then be hashed
     */
    getHashableData() {
        let hashable = "";
        hashable += this.sender;
        hashable += this.execution.moduleName;
        hashable += this.execution.functionName;
        hashable += JSON.stringify(this.execution.args);
        hashable += this.execution.moduleChecksum;
        hashable += this.execution.functionChecksum;
        hashable += this.execution.changeSet;
        for(let i = 0; i < this.validatedTransactions.length; i++) {
            hashable += this.validatedTransactions[i].transactionHash;
            hashable += this.validatedTransactions[i].moduleChecksum;
            hashable += this.validatedTransactions[i].transactionChecksum;
            hashable += this.validatedTransactions[i].changeSet;
        }
        return hashable;
    }

    /**
     * Gets the validated transaction hashes as an array from the validatedTransactions data
     */
    getValidatedTXHashes() {
        let result = [];
        for(let i = 0; i < this.validatedTransactions.length; i++) {
            result.push(this.validatedTransactions[i].transactionHash);
        }
        return result;
    }
}
