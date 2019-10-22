const router = require('express').Router();
const Blockchain = require('../dev/blockchain');
const uuid = require('uuid/v1');
const request = require('request-promise');
const nodeAddress = uuid().split('-').join('');
const path = require('path');


const bitcoin = new Blockchain();

router.get('/blockchain',(req,res)=>{
    res.send(bitcoin);
});

router.post('/transaction',(req,res)=>{
    const newTransaction = req.body;
    const blockIndex = bitcoin.addTransactionToPendingTransaction(newTransaction);
    res.send({ msg : `Transaction will be added in block ${blockIndex}`});
});

router.get('/mine',(req,res)=>{
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: lastBlock['index'] + 1
    }

    const nonce = bitcoin.proofOfWork(previousBlockHash,currentBlockData);

    const blockHash = bitcoin.hashBlock(previousBlockHash,currentBlockData,nonce);
    const regNodesPromise = [];

    const newBlock = bitcoin.createNewBlock(nonce,previousBlockHash,blockHash);
    
    bitcoin.networkNodes.forEach((networkNodeUrl)=>{
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method : 'POST',
            body: {newBlock : newBlock },
            json : true
        }
        regNodesPromise.push(request(requestOptions));
    });

    Promise.all (regNodesPromise)
    .then(data => {
        const requestOptions = {
            uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
            method : 'POST',
            body: {
                amount : 12.5,
                sender : 0,
                recipient : nodeAddress
            },
            json : true
        }
        return request(requestOptions)
    }).then(data => {
        res.json({notes : "Blocked is mined successfully and broadcasted","newBlock" : newBlock});
    })
});

// Register the node and broadcast it to the network
router.post("/register-broadcast-node",(req,res)=>{
    const newNodeUrl = req.body.newNodeUrl;
    const regNodesPromise = [];
    const duplicateNode =  bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const presentNode = bitcoin.currentNodeUrl != newNodeUrl;

    if(duplicateNode &&  presentNode) 
    {
    bitcoin.networkNodes.push(newNodeUrl);
    bitcoin.networkNodes.forEach((networkNodeUrl)=>{
        const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method : 'POST',
            body: {newNodeUrl : newNodeUrl },
            json : true
        }
        regNodesPromise.push(request(requestOptions));
    });

    Promise.all(regNodesPromise)
    .then(data=>{
        const bulkRegisterOptions = {
            uri : newNodeUrl + '/register-node-bulk',
            method : 'POST',
            body : {allNetworkNodes : [...bitcoin.networkNodes,bitcoin.currentNodeUrl]},
            json: true
        }
       return  request(bulkRegisterOptions)


    }).then(()=>{
        res.json({note:"New nodes has succesfully registered"})
    })
    }else{
        res.json({note:"It is Already Added or Same node"})
    }


});

// If new node is already broadcasted to network then other nodes should register the node not broadcast that node
router.post('/register-node',(req,res)=>{
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
    if(nodeNotAlreadyPresent && notCurrentNode) 
    {
    bitcoin.networkNodes.push(newNodeUrl);
    res.json({note:`new node sucessfully added to current node ${bitcoin.currentNodeUrl}` });
    }else {
        res.json({note:` It is Already Added or Same node ${bitcoin.currentNodeUrl}` });
    }
});

// register multiple node at once
router.post('/register-node-bulk',(req,res)=>{
     const allNetworkNodes = req.body.allNetworkNodes;

     allNetworkNodes.forEach(networkNodeUrl =>{
        const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;

        if(nodeNotAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(networkNodeUrl);

     });

     res.send({note: "All nodes are successfully registered to new nodes"});
});

// Broadcast the transaction to each network node
router.post('/transaction/broadcast',(req,res)=>{
    const newTransaction = bitcoin.createNewTransaction(req.body.amount,req.body.sender,req.body.recipient);
    bitcoin.addTransactionToPendingTransaction(newTransaction);
    const requestPromise = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri : networkNodeUrl + '/transaction',
            method : 'POST',
            body : newTransaction,
            json : true
        }
        requestPromise.push(request(requestOptions));
    })

    Promise.all (requestPromise)
    .then(data =>{
        res.json({notes:"Transacation has been created and broadcast Successfully"});
    }
    )
});

// Receive new block
router.post('/receive-new-block',(req,res)=>{
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const tempPreviousBlockhash = lastBlock.hash === newBlock.previousBlockHash;
    const tempIndex = lastBlock['index'] + 1 === newBlock["index"];

    if(tempPreviousBlockhash && tempIndex){
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions =[];
        res.send({note: "New Block is received and accepted",newBlock : newBlock});


    }else{
        res.send(
            {note: "Previous Block / index hash did not match so blocks are not properly sync"});
    }
   

    
});


router.get('/consensus',(req,res)=>{
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl=>{
        const requestOptions = {
            uri : networkNodeUrl + '/blockchain',
            method : 'GET',
            json : true
        }

        requestPromises.push(request(requestOptions));
    });

    Promise.all(requestPromises)
    .then(blockchains=>{
         const currentChainLength = bitcoin.chain.length;
         let maxChainLength = currentChainLength;
         let newLongestChain;
         let newPendingTransactions;

         blockchains.forEach(blockchain =>{
            if(blockchain.chain.length > maxChainLength){
                maxChainLength = blockchain.chain.length;
                newLongestChain = blockchain.chain;
                newPendingTransactions = blockchain.pendingTransactions;
            };

        });
     

        if (!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain))){
            res.json({
                notes :'Current Chain Has not been replaced',
                chain: bitcoin.chain
            })
        }
        else
        {
            bitcoin.chain = newLongestChain;
            bitcoin.pendingTransactions = newPendingTransactions;
            res.json({
                notes: 'chain has been replaced',
                chain: bitcoin.chain
            })
        }
     }).catch(err=>{
         res.json({notes: "some err"+ err});
     })
});


router.get('/block/:blockHash',(req,res)=>{
let block = bitcoin.getBlock(req.params.blockHash);
if(block && block.length){
    res.send(block);
}
else{
res.send({notes:"This Block is not avaliable"});
}

});


router.get('/transaction/:transactionId',(req,res)=>{
    let block = bitcoin.getTransaction(req.params.transactionId);

    res.json(block);
});

router.get('/address/:address',(req,res)=>{
    let address = req.params.address;
    const addressData = bitcoin.getAddressData(address);
    res.json({
        'addressData': addressData
    })
});

router.get('/block-explorer',(req,res)=>{

    res.sendFile(path.join(__dirname,"../dev/blockexplorer","index.html"));
});

module.exports = router;