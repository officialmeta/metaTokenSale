const MetaToken = artifacts.require('./MetaToken.sol')
const MetaTokenSale = artifacts.require('./MetaTokenSale.sol')
const { should, EVMThrow } = require('./helpers')
const assertFail = require("./assertFail");
const timeTravel = require("./timeTravel");

/*
* Function to easily initialize the Sale/Token for every Test	
*/
async function init(_rate, _totalCap, _goal, _wallet, _openingTime, _closingTime) {
	let metaToken = await MetaToken.new()
    	let metaTokenSale = await MetaTokenSale.new(metaToken.address, _rate, _totalCap,  _goal, _wallet, _openingTime, _closingTime)
	await metaToken.transferOwnership(metaTokenSale.address)

    return {
        metaToken, metaTokenSale
    };
}

/*
* Tests for the Token itself
*/
contract('MetaToken', (accounts) => {
    let metaToken

    beforeEach('create Token', async function() {
	metaToken = await MetaToken.new()
    })

    it('correct name', async () => {
        assert.equal(await metaToken.name(), "MetaToken")
    })

    it('correct symbol', async () => {
        assert.equal(await metaToken.symbol(), "XMT")
    })

    it('correct decimals', async () => {
        assert.equal(await metaToken.decimals(), 18)
    })

    it('can mint tokens', async () => {
        metaToken.mint(accounts[0], 5000)	
	const balance = await metaToken.balanceOf(accounts[0])
	assert.equal(balance.toString(10), 5000);
    })


})

/*
* Tests for the Sale
*/

contract('MetaTokenSale', (accounts) => {
    let metaToken
    let metaTokenSale
    let day = 86400
    let now

    beforeEach('get the actual time', async function() {
	now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    })

    it('tokenSale is owner of token', async () => {
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(25000, "ether"), web3.toWei(10000, "ether"), accounts[1], now+1, now+1000)
        const metaTokenOwner = await metaToken.owner()
        metaTokenOwner.should.be.equal(metaTokenSale.address)
    })

    it('user can buy meta in Phase 1', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(25000, "ether"), web3.toWei(10000, "ether"), accounts[1], now, now+1000)
	await metaTokenSale.addToWhitelist(accounts[2])
	await metaTokenSale.setUserCap(accounts[2], web3.toWei(15, "ether"))
	await metaTokenSale.sendTransaction({ from: accounts[2], value: web3.toWei(1, "ether")})

	const balance = await metaToken.balanceOf(accounts[2])

	assert.equal(web3.fromWei(balance.toString(10), "ether"), 4800);
    })


    it('user can buy meta in Phase 2', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(25000, "ether"), web3.toWei(10000, "ether"), accounts[1], now, now+10000000)
	metaTokenSale.addToWhitelist(accounts[2])
	await metaTokenSale.setUserCap(accounts[2], web3.toWei(15, "ether"))
	//Travel 1 Week ahead to get into Phase 2
	await timeTravel(605000)
	metaTokenSale.sendTransaction({ from: accounts[2], value: web3.toWei(1, "ether")})

	const balance = await metaToken.balanceOf(accounts[2])

	assert.equal(web3.fromWei(balance.toString(10), "ether"), 3800);
    })

    it('user can buy up to cap', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(10, "ether"), web3.toWei(10, "ether"), accounts[1], now-1, now+1000)
	await metaTokenSale.addToWhitelist(accounts[3])
	await metaTokenSale.setUserCap(accounts[3], web3.toWei(15, "ether"))
	await metaTokenSale.sendTransaction({ from: accounts[3], value: web3.toWei(10, "ether")})
	const balance = await metaToken.balanceOf(accounts[3])
	assert.equal(web3.fromWei(balance.toString(10), "ether"), 48000);

    })

    it('user can\'t buy over cap', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(10, "ether"), web3.toWei(10, "ether"), accounts[1], now, now+1000)
	await metaTokenSale.addToWhitelist(accounts[3])
	await metaTokenSale.setUserCap(accounts[3], web3.toWei(15, "ether"))
	await assertFail(metaTokenSale.sendTransaction({ from: accounts[3], value: web3.toWei(11, "ether")}))

    })

    it('user can\'t buy before opening', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(10, "ether"), web3.toWei(100, "ether"), accounts[1], now+10000, now+10010)
	await metaTokenSale.addToWhitelist(accounts[4])
	await metaTokenSale.setUserCap(accounts[4], web3.toWei(15, "ether"))
	await assertFail(metaTokenSale.sendTransaction({ from: accounts[4], value: web3.toWei(2, "ether")}))

    })

    it('user can\'t buy after closing', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(10, "ether"), web3.toWei(100, "ether"), accounts[1], now, now+100)
	await metaTokenSale.addToWhitelist(accounts[4])
	await timeTravel(86400)
	await metaTokenSale.setUserCap(accounts[4], web3.toWei(15, "ether"))
	await assertFail(metaTokenSale.sendTransaction({ from: accounts[4], value: web3.toWei(2, "ether")}))

    })

    it('user can\'t buy if not whitelisted', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(25000, "ether"), web3.toWei(10000, "ether"), accounts[1], now, now+100000)
	await assertFail(metaTokenSale.sendTransaction({ from: accounts[4], value: web3.toWei(11, "ether")}))

    })

    it('user can be unwhitelsited', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(25000, "ether"), web3.toWei(10000, "ether"), accounts[1], now, now+1000000)
	await metaTokenSale.addToWhitelist(accounts[4])
	await metaTokenSale.setUserCap(accounts[4], web3.toWei(15, "ether"))
	await metaTokenSale.removeFromWhitelist(accounts[4])
	assert.equal(await metaTokenSale.whitelist(accounts[4]), false);
    })

    it('contributed ether lead to valid number of ether in the saleWallet', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(25000, "ether"), web3.toWei(10000, "ether"), accounts[1], now, now+10000)
	let balanceBeforeContribution = web3.eth.getBalance(accounts[1])
	await metaTokenSale.addToWhitelist(accounts[5])
	await metaTokenSale.setUserCap(accounts[5], web3.toWei(15, "ether"))
	await metaTokenSale.sendTransaction({ from: accounts[5], value: web3.toWei(10, "ether")})
	const balanceAfterContribution = web3.eth.getBalance(accounts[1])
	assert.equal(balanceAfterContribution.valueOf()-balanceBeforeContribution.valueOf(), web3.toWei(10, "ether"))
    })

    it('user can\'t exceed personal cap', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(25000, "ether"), web3.toWei(10000, "ether"), accounts[1], now, now+100000)
	await metaTokenSale.addToWhitelist(accounts[5])
	await metaTokenSale.setUserCap(accounts[5], web3.toWei(5, "ether"))
	await assertFail(metaTokenSale.sendTransaction({ from: accounts[5], value: web3.toWei(6, "ether")}))

    })
})

