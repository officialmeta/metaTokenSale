module.exports = seconds =>
  new Promise((resolve, reject) => {
        web3.currentProvider.sendAsync({
          jsonrpc: "2.0",
          method: "evm_increaseTime",
          params: [seconds], // 86400 is num seconds in day
          id: new Date().getTime()
        }, (err, result) => {
          if(err){ return reject(err) }
          return resolve(result)
        });
      });
   
