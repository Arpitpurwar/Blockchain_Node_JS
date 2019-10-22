/*  Blockchain Data Structure 
   First Approach is constructor way

*/


const sha256 = require('sha256');
let currentNode = process.argv[3];
const uuid = require('uuid/v1');
const nodeAddress = uuid().split('-').join('');


function Blockchain(){
    this.chain = [];
    this.pendingTransactions = [];
    // genesis Block
    this.createNewBlock(100,'0','0');
    this.currentNodeUrl = currentNode;
    this.networkNodes = [];
}

// create New Block method for Blockchain Constructor
Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash,hash){
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        nonce: nonce,
        hash: hash,
        previousBlockHash: previousBlockHash 
    };

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;

}

// get Last block 
Blockchain.prototype.getLastBlock = function(){
    return this.chain[this.chain.length-1];
}

// new transaction
Blockchain.prototype.createNewTransaction = function(amount, sender, recipient){
    const newTransactions = {
        transactionId :nodeAddress,
        amount: amount,
        sender: sender,
        recipient: recipient
    };
    return newTransactions;
}

// add created transaction to pending transaction
Blockchain.prototype.addTransactionToPendingTransaction = function (transactionObj){
    this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;
}

// hash the Block
Blockchain.prototype.hashBlock = function(previousBlockHash,currentBlockData,nonce){
    const dataasString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData); 
    const hash = sha256(dataasString);
    return hash;

}

// proof of work
Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData){
    let nonce = 0;
    // var d = new Date();
    // console.log("Start",d.getMinutes(),":",d.getSeconds());
    let hash = this.hashBlock(previousBlockHash,currentBlockData,nonce);
   
    while(hash.substring(0,4) !== '0000'){
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData,nonce);
        // console.log("Naunce: ",nonce,"Hash: ",hash);
    }
    // console.log("End",d.getMinutes(),":",d.getSeconds());
    return nonce;

}


Blockchain.prototype.chainIsValid = function(blockchain){
    let validChain = true;

    for(var i =1; i< blockchain.length; i++){
        const currentBlock = blockchain[i];
        const previousBlock = blockchain[i - 1];
        const newBlockForHash = 
        {
            transactions: currentBlock['transactions'],
            index : currentBlock['index']
        }
        const blockHash = this.hashBlock(previousBlock['hash'],newBlockForHash,currentBlock['nonce']);
 
        if(currentBlock['previousBlockHash'] !== previousBlock['hash'] && blockHash.substring(0,4) !== '0000'){
            validChain = false;
        }
    }
    const genesisBlock = blockchain[0];
    const correctNode = genesisBlock['nonce'] === 100;
    const correctPreviousHash = genesisBlock['previousBlockHash'] === '0';
    const correctHash = genesisBlock['hash'] === '0';
    const correctTransaction = genesisBlock['transactions'].length === 0;


    if(!correctNode || !correctPreviousHash || !correctHash || !correctTransaction) validChain = false;
    
    return validChain;

};

Blockchain.prototype.getBlock = function(blockHash){
    return this.chain.filter(block => block.hash === blockHash);
};

Blockchain.prototype.getTransaction = function(transactionId){
    let transaction;
    let transactionBlock = [];
   this.chain.forEach(blocks=>{

       transaction = blocks.transactions.filter(transaction => transaction.transactionId ===  transactionId);
       if(transaction && transaction.length){
        transactionBlock = blocks;
        
       }
    })
   return {
       transaction : transaction,
       block : transactionBlock
   }
}

Blockchain.prototype.getAddressData = function(address){
    const addressTransactions = [];
    let transaction;

   this.chain.forEach(blocks=>{

       blocks.transactions.forEach(transaction => {
           if(transaction.sender ===  address || transaction.recipient ===  address){
            addressTransactions.push(transaction);
           }
         });
    });

    let balance = 0;
    addressTransactions.forEach(transaction =>{

      if(transaction.recipient === address)
      { balance += transaction.amount}
      else if(transaction.sender === address) {balance -= transaction.amount};
    })


   return {
    addressTransactions : addressTransactions,
    addressBalance :balance
   }
       
}


// Class way

// class Blockchain{
//     constructor(){
//         this.chain = [];
//         this.pendingTransactions = [];       
//     }

//     createNewBlock(nonce,previousBlockHash,hash){
//         const newBlock = {
//             index: this.chain.length + 1,
//             timestamp: Date.now(),
//             transactions: this.pendingTransactions,
//             nonce: nonce,
//             hash: hash,
//             previousBlockHash: previousBlockHash 
//         };
    
//         this.pendingTransactions = [];
//         this.chain.push(newBlock);
    
//         return newBlock;

//     }

// }

module.exports = Blockchain;