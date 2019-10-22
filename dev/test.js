const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();

// bitcoin.createNewBlock(1,'PREVIOUSHASHED',"HASHED");
// bitcoin.createNewTransaction(200,"Arpit","Sender");
// bitcoin.createNewBlock(1234,'PREVIOUSHASHED2',"HASHED2");

const blockChain =
{"chain":[{"index":1,"timestamp":1564981598720,"transactions":[],"nonce":100,"hash":"0","previousBlockHash":"0"},{"index":2,"timestamp":1564981643581,"transactions":[],"nonce":18140,"hash":"0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100","previousBlockHash":"0"},{"index":3,"timestamp":1564981651788,"transactions":[{"transactionId":"cd8dd2f0b73e11e9b73eb50d019a7430","amount":12.5,"sender":0,"recipient":"ce38b8f0b73e11e9b73eb50d019a7430"}],"nonce":325225,"hash":"0000239284280bd2d81413927c7f2627ff28a37eb36b2f92f6ebe7b90f843ec2","previousBlockHash":"0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100"}],"pendingTransactions":[{"transactionId":"cd8dd2f0b73e11e9b73eb50d019a7430","amount":12.5,"sender":0,"recipient":"ce38b8f0b73e11e9b73eb50d019a7430"}],"currentNodeUrl":"http://localhost:3001","networkNodes":[]}


//test Hash method
//let hashesd = bitcoin.hashBlock(previousBlockHash,currentBlockData,nonce)


// test Proof of work method
//let naunce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);

console.log("bitcoin", bitcoin.getBlock("0"));

