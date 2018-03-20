const MetaTokenSale = artifacts.require("./MetaTokenSale.sol")
const MetaToken = artifacts.require("./MetaToken.sol")

module.exports = function(deployer, network, accounts) {
  const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 1 // one second in the future
  const endTime = startTime + (120 * 2) // 20 days
  const rate = 500
  const wallet = accounts[1]

deployer.deploy(MetaToken).then(function() {
  return deployer.deploy(MetaTokenSale, MetaToken.address, rate, 125000000000000, 125000000000000, wallet, startTime, endTime)

  });

 MetaToken.deployed().then(inst => inst.transferOwnership(crowdsale.address))  
};

