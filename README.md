# Seed - The Decentralized Cooperative Networking Approach

Seed is a cooperative proof-of-work blockchain. The protocol will allow for the creation of mudules to run decentralized applications on the network. The end goal of Seed is to attempt to create a network which can achieve near real-time networking requirements when needed that runs on a truly distributed minner-less network of users.

-----

# Source Code

## Seed

The Seed source code for the Seed npm module can be found in the /seedSrc folder. This folder is the initially created JavaScript implementation of the Seed protocol.

## Client Source Code

The Client source code is an Electron wallet being created for both the Seed cryptocurrency module, as well as for general interactions with the general Seed blockchain. This code can be found in the /clientSrc folder.

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
- [ ] Design Blockchain & Entanglement Portion
    - [x] [High-Level Design](https://steemit.com/blockchain/@carsonroscoe/seed-development-design-entanglement-and-blockchain-hybrid)
    - [ ] Design Transaction Structure
    - [ ] Design Entanglement Portion
    - [ ] Design Blockchain Portion
- [ ] Implement Entanglement Portion
- [ ] Implement Transaction Squashing
- [ ] Implement Blockchain Portion
- [ ] Implement Unit Tests For Entanglement, Transaction Squashing And Blockchain Portions

## DApp Modules & Virtual Machine

- [x] Research Relevant Problems
    - [x] [Provable Execution In JavaScript](https://steemit.com/blockchain/@carsonroscoe/seed-dev-discussion-provable-execution-with-function-hashing-in-javascript)
    - [x] [JavaScript Pseudo-VirtualMachine vs Custom Language or True Virtual Machine](https://steemit.com/cryptocurrency/@carsonroscoe/seed-dev-discussion-custom-languages-and-virtual-machines)
- [x] [Design Modules & Virtual Machine](https://steemit.com/blockchain/@carsonroscoe/seed-development-design-module-smart-contracts-and-the-svm)
- [x] [Implement Basic Module Design](https://steemit.com/utopian-io/@carsonroscoe/seed-development-modules-smart-contracts-and-the-svm)
- [x] [Implement Virtual Machine](https://steemit.com/utopian-io/@carsonroscoe/seed-development-modules-smart-contracts-and-the-svm)
- [x] [Implement Unit Tests For Example Modules & Virtual Machine](https://steemit.com/utopian-io/@carsonroscoe/seed-development-modules-smart-contracts-and-the-svm)
- [ ] Connect Virtual Machine To Blockchain Ledger
- [ ] Subscription System For External DApp Integration

## Client

- [x] Create Base Electron Client And Pair With Seed Source
- [ ] Design UI For Seed Module
- [ ] Create UI For Seed Module
- [ ] Design Client Networking & Routing Portion
- [ ] Implement Networking

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
