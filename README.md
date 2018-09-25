# Seed

## The Decentralized Cooperative Networking Approach

Seed is a cooperative proof-of-work DAG/blockchain. The protocol will allow for the creation of Modules (Smart Contracts) to run decentralized applications on the network. The end goal of Seed is to attempt to create a network which can achieve near real-time networking requirements when needed that runs on a truly distributed minner-less network of users.

[Detailed Introduction](https://steemit.com/cryptocurrency/@carsonroscoe/seed-introduction-the-decentralized-cooperative-networking-approach)

[Problems & Hypothesized Solutions](https://steemit.com/cryptocurrency/@carsonroscoe/seed-problems-and-hypothesized-solutions-the-cooperative-blockchain-scaling-solution)

-----

# Source Code

## Seed

The Seed source code for the Seed npm module can be found in the [/seedSrc](/seedSrc) folder. This folder is the initially created JavaScript implementation of the Seed protocol. This will have as few dependencies as possible, primarily relying on NodeJS and Vanilla JavaScript features.

## Client Source Code

The Client source code is an Electron wallet being created for both the Seed cryptocurrency module, as well as for general interactions with the general Seed blockchain. This code can be found in the [/clientSrc](/clientSrc) folder. The client will have less constraints for depencies, and will primarily be developed with NodeJS and Electron.

-----

# How To Run

After cloning the repository, you will need to run `npm i` inside both the clientSrc and seedSrc for all the dependencies to be installed.

Then the simplified client, point your terminal to the [/clientSrc](/clientSrc) folder and invoke the command "npm start".

In order to run the client as a RelayNode, run the command "npm run relay:osx", with your operating system listed after the "relay" command (e.g. relay:osx or relay:linux).

In order to run the client as a networked Client, run the command "npm run client:osx", with your operating system listed after the "relay" command (e.g. relay:osx or relay:linux).

Once run, instructions will appear on the screen regarding how to open the console. The console will display the results of the unit tests being run, confirming the programs state.

In the near future, a proper UI will be implemented for the client.

## Run Unit Tests

In order to run the unit tests, instead run the command "npm test".

If that fails to run, your OS may require a different setup. Try "npm run test:osx", with your operating system listed after the "test" command (e.g. test:osx or test:linux)

## Sample Commands

npm run test:osx

npm run relay:linux

npm run client:osx

-----

# Project Roadmap

## Literature/Background Research

- [x] [Literature Reviews On Blockchain Inefficiencies](https://steemit.com/blockchain/@carsonroscoe/seed-literature-review-the-flaws-of-proof-of-work)
- [x] [Blockchain Research Proposal](design/ResearchProposal_CarsonRoscoe.pdf)
- [x] [Seed Project Proposal](design/ProjectProposal.pdf)

## Cryptography

- [x] Research Relevant Cryptography
    - [x] [Hashing Algorithms](https://steemit.com/bitcoin/@carsonroscoe/seed-dev-discusses-hashing-algorithms-in-bitcoin-and-cryptocurrencies)
    - [x] [Public Key Encryption](https://steemit.com/bitcoin/@carsonroscoe/seed-dev-debates-public-key-encryption)
    - [x] \(Optional) [Post-Quantum Cryptography](https://steemit.com/crypto/@carsonroscoe/seed-dev-discussion-lattice-based-cryptography-part-1)
- [x] [Design Cryptography Portion](https://steemit.com/cryptocurrency/@carsonroscoe/seed-development-design-cryptography-public-key-encryption-and-hashing)
- [x] [Implement Cryptography Portion](https://steemit.com/utopian-io/@carsonroscoe/seed-development-base-project-and-cryptographic-portion)
- [x] Implement Cryptography Unit Tests
- [ ] \(Optional) Design, Implement & Test Post-Quantum Cryptography

## Blockchain & Entanglement

- [x] Research Relevant Problems
    - [x] Blockchain vs DAG's [(Part 1)](https://steemit.com/bitcoin/@carsonroscoe/seed-dev-discussion-tangle-vs-blockchain-part-1)/[(Part 2)](https://steemit.com/bitcoin/@carsonroscoe/seed-dev-discussion-tangle-vs-blockchain-part-2)
    - [x] Transaction Squashing [(Part 1)](https://steemit.com/blockchain/@carsonroscoe/seed-dev-discussion-transaction-squashing-proposition-part-1)/[(Part 2)](https://steemit.com/blockchain/@carsonroscoe/seed-dev-discussion-transaction-squashing-considerations-for-jitter-part-2)
- [x] Design Blockchain & Entanglement Portion
    - [x] [High-Level Design](https://steemit.com/blockchain/@carsonroscoe/seed-development-design-entanglement-and-blockchain-hybrid)
    - [x] [Design Transaction Structure](https://steemit.com/crypto/@carsonroscoe/seed-development-design-transactions-and-entanglement)
    - [x] [Design Entanglement Portion](https://steemit.com/crypto/@carsonroscoe/seed-development-design-transactions-and-entanglement)
    - [x] [Design Blockchain Portion](https://steemit.com/crypto/@carsonroscoe/seed-development-design-transaction-squashing)
- [x] Implement
    - [x] Entanglement Portion
    - [x] Transaction Squashing
    - [x] Blockchain Portion
    - [ ] State Saving and Loading
- [x] Implement Unit Tests Unit Test
    - [x] For Entanglement
    - [x] For Transaction Squashing
    - [x] For Blockchain Portions

## DApp Modules & Virtual Machine

- [x] Research Relevant Problems
    - [x] [Provable Execution In JavaScript](https://steemit.com/blockchain/@carsonroscoe/seed-dev-discussion-provable-execution-with-function-hashing-in-javascript)
    - [x] [JavaScript Pseudo-VirtualMachine vs Custom Language or True Virtual Machine](https://steemit.com/cryptocurrency/@carsonroscoe/seed-dev-discussion-custom-languages-and-virtual-machines)
- [x] [Design Modules & Virtual Machine](https://steemit.com/blockchain/@carsonroscoe/seed-development-design-module-smart-contracts-and-the-svm)
- [x] [Implement Basic Module Design](https://steemit.com/utopian-io/@carsonroscoe/seed-development-modules-smart-contracts-and-the-svm)
- [x] [Implement Virtual Machine](https://steemit.com/utopian-io/@carsonroscoe/seed-development-modules-smart-contracts-and-the-svm)
- [x] [Implement Unit Tests For Example Modules](https://steemit.com/utopian-io/@carsonroscoe/seed-development-modules-smart-contracts-and-the-svm)
- [x] Connect Virtual Machine To Blockchain/Entanglement Ledger
- [x] Subscription System For External DApp Integration
- [x] Implement Unit Tests
    - [x] For Seed Virtual Machine
    - [x] For Ledger
    - [x] For Subscription System

## Storage

- [x] [Design Storage Saving & Loading](https://steemit.com/crypto/@carsonroscoe/seed-development-transaction-and-block-storage)
- [x] Implement
    - [x] [Dynamic Storage System](https://steemit.com/utopian-io/@carsonroscoe/3q2gw4-seed-development-transaction-and-block-storage)
    - [x] [File Storage Implementation](https://steemit.com/utopian-io/@carsonroscoe/3q2gw4-seed-development-transaction-and-block-storage)
    - [x] [Local Storage Implementation](https://steemit.com/utopian-io/@carsonroscoe/3q2gw4-seed-development-transaction-and-block-storage)
- [x] Unit Test
    - [x] File Storage
    - [x] Local Storage
    - [x] Storage Subsystem

## Client

- [x] Create Base Electron Client And Pair With Seed Source
- [x] Add Dynamic Module Loading
- [x] Create High Level API For Electron DApps
- [x] Design UI For Seed Module
- [x] Create Simple UI For Seed Module
- [ ] Style UI For Seed Module
- [x] Design Client Networking & Routing Portion
- [x] Implement Networking

-----

# How To Contribute

Seed is open source project and is open to public contributions. 

## Background Information

If you would like to know the full background information of the project, the [research proposal](/design/ResearchProposal_CarsonRoscoe.pdf) & [project proposal](/design/ProjectProposal.pdf) can be found in the [/design](/design) folder.

As that is a lot of reading, discussion/design/development updates can also be selectively read at [Carson Roscoe's blog](https://steemit.com/@carsonroscoe). Just search for blog title which begin with "Seed".

## Tasks

The roadmap above is the current "To-Do" list. If you feel comfortable tackling any task, feel free to clone/fork the repository and begin contributing. Simply create a pull request with your changes, and it will be reviewed by one of the repository owners before being accepted.

If you have another way you'd like to contribute that is not completing one of the above tasks, update this README.md file and pull-request it in so we know what features you'd like to add.

## Contact Repository Owners

For questions or more information, please create an issue in the Seed repository or contact [Carson Roscoe](https://github.com/CarsonRoscoe) directly.
