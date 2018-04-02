const MetaToken = artifacts.require('./MetaToken.sol')
const MetaTokenSale = artifacts.require('./MetaTokenSale.sol')
const TokenVesting = artifacts.require('./TokenVesting.sol')
const { should, EVMThrow} = require('./helpers')
const assertFail = require("./assertFail")
const timeTravel = require("./timeTravel")
const BigNumber = web3.BigNumber

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

contract('MetaTokenSale: Ownership', (accounts) => {
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
})

//Tests for everything time related
contract('MetaTokenSale: Time', (accounts) => {
    let metaToken
    let metaTokenSale
    let day = 86400
    let now

    beforeEach('get the actual time', async function() {
	now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    })

    it('user can\'t buy before opening', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(10, "ether"), web3.toWei(100, "ether"), accounts[1], now+10000, now+10010)
	await metaTokenSale.addToWhitelist(accounts[4])
	await metaTokenSale.setUserCap(accounts[4], web3.toWei(15, "ether"))
	await assertFail(metaTokenSale.sendTransaction({ from: accounts[4], value: web3.toWei(2, "ether")}))

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


    it('user can\'t buy after closing', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(10, "ether"), web3.toWei(100, "ether"), accounts[1], now, now+100)
	await metaTokenSale.addToWhitelist(accounts[4])
	await timeTravel(86400)
	await metaTokenSale.setUserCap(accounts[4], web3.toWei(15, "ether"))
	await assertFail(metaTokenSale.sendTransaction({ from: accounts[4], value: web3.toWei(2, "ether")}))

    })
})

//Whitelisting related tests
contract('MetaTokenSale: Whitelist', (accounts) => {
    let metaToken
    let metaTokenSale
    let day = 86400
    let now

    beforeEach('get the actual time', async function() {
	now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    })

    it('user can\'t buy if not whitelisted', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(25000, "ether"), web3.toWei(10000, "ether"), accounts[1], now, now+100000)
	await assertFail(metaTokenSale.sendTransaction({ from: accounts[4], value: web3.toWei(11, "ether")}))

    })

    it('user can be whitelsited', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(25000, "ether"), web3.toWei(10000, "ether"), accounts[1], now, now+1000000)
	await metaTokenSale.addToWhitelist(accounts[4])
	await metaTokenSale.setUserCap(accounts[4], web3.toWei(15, "ether"))
	await metaTokenSale.removeFromWhitelist(accounts[4])
	assert.equal(await metaTokenSale.whitelist(accounts[4]), false);
    })

    it('user can be unwhitelsited', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(25000, "ether"), web3.toWei(10000, "ether"), accounts[1], now, now+1000000)
	await metaTokenSale.addToWhitelist(accounts[4])
	await metaTokenSale.setUserCap(accounts[4], web3.toWei(15, "ether"))
	await metaTokenSale.removeFromWhitelist(accounts[4])
	assert.equal(await metaTokenSale.whitelist(accounts[4]), false);
    })

    it('ToDo: Groups can be whitelisted', async () => {

	assert.equal(false, false);
    })

    it('ToDo: Groups can be unwhitelisted', async () => {

	assert.equal(false, false);
    })
})

//Tests concerning total and personal cap
contract('MetaTokenSale: Cap', (accounts) => {
    let metaToken
    let metaTokenSale
    let day = 86400
    let now

    beforeEach('get the actual time', async function() {
	now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    })


    it('user can\'t buy over total cap', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(10, "ether"), web3.toWei(10, "ether"), accounts[1], now, now+1000)
	await metaTokenSale.addToWhitelist(accounts[3])
	await metaTokenSale.setUserCap(accounts[3], web3.toWei(15, "ether"))
	await assertFail(metaTokenSale.sendTransaction({ from: accounts[3], value: web3.toWei(11, "ether")}))

    })

    it('user can buy up to total cap', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(10, "ether"), web3.toWei(10, "ether"), accounts[1], now, now+1000)
	await metaTokenSale.addToWhitelist(accounts[3])
	await metaTokenSale.setUserCap(accounts[3], web3.toWei(15, "ether"))
	await metaTokenSale.sendTransaction({ from: accounts[3], value: web3.toWei(10, "ether")})
	const balance = await metaToken.balanceOf(accounts[3])
	assert.equal(await web3.fromWei(balance.toString(10), "ether"), 48000);

    })

    it('ToDo: user can buy up to personal cap', async () => {
	
	assert.equal(false, false);

    })

    it('user can\'t exceed personal cap', async () => {
	
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(25000, "ether"), web3.toWei(10000, "ether"), accounts[1], now, now+100000)
	await metaTokenSale.addToWhitelist(accounts[5])
	await metaTokenSale.setUserCap(accounts[5], web3.toWei(5, "ether"))
	await assertFail(metaTokenSale.sendTransaction({ from: accounts[5], value: web3.toWei(6, "ether")}))

    })
})

//Tests concerning minting
contract('MetaTokenSale: Minting', (accounts) => {
    let metaToken
    let metaTokenSale
    let day = 86400
    let now

    beforeEach('get the actual time', async function() {
	now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    })

    it('ToDo: tokens get minted', async () => {
	assert.equal(false, false);
    })

    it('ToDo: after closing no tokens get minted', async () => {
	assert.equal(false, false);
    })
})

//Tests concerning vesting
contract('MetaTokenSale: Vesting', (accounts) => {
    let metaToken
    let metaTokenSale
    let tokenvesting
    let minute = 60
    //30 days
    let month = 2592000
    let now
    const amount = 25000000 

    beforeEach('get the actual time and setup contracts', async function() {
	now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;

	this.metaToken = await MetaToken.new()
	this.start = now+minute
	this.duration = 46656000
	this.cliff = 15552000
	this.tokenVesting = await TokenVesting.new(accounts[6], this.start, this.cliff, this.duration, true);

    	this.metaTokenSale = await MetaTokenSale.new(this.metaToken.address, 4000, web3.toWei(25000, "ether"), web3.toWei(10000, "ether"), accounts[1], now, now+100000)
	await this.metaToken.mint(this.tokenVesting.address, amount)
	await this.metaToken.transferOwnership(this.metaTokenSale.address, { from: accounts[0] })
    })

    it('cannot be released before cliff', async function () {
	await assertFail(this.tokenVesting.release(this.metaToken.address))
    });

    it('can be released after cliff', async function () {
	await timeTravel(this.cliff+minute);
	await this.tokenVesting.release(this.metaToken.address).should.be.fulfilled;
    });

    it('should release proper amount after cliff', async function () {
	const balanceBefore = await this.metaToken.balanceOf(accounts[6]);
	await timeTravel(this.cliff+minute);

	const { receipt } = await this.tokenVesting.release(this.metaToken.address);
	const releaseTime = await web3.eth.getBlock(receipt.blockNumber).timestamp;

	const balanceAfter = await this.metaToken.balanceOf(accounts[6]);
	const balance = balanceAfter - balanceBefore
	balance.should.equal(Math.floor(amount * ((releaseTime - this.start)/this.duration)));
    });

    it('should have released all after end', async function () {
	const balanceBefore = await this.metaToken.balanceOf(accounts[6]);
	await timeTravel(this.start+this.duration+minute);
	await this.tokenVesting.release(this.metaToken.address);
	const balanceAfter = await this.metaToken.balanceOf(accounts[6]);
	const balance = balanceAfter - balanceBefore
	balance.should.equal(amount);
    });
})



//Tests concerning contributions
contract('MetaTokenSale: Contributions', (accounts) => {
    let metaToken
    let metaTokenSale
    let day = 86400
    let now

    beforeEach('get the actual time', async function() {
	now = web3.eth.getBlock(web3.eth.blockNumber).timestamp;
    })

    it('TeamWallet is correct', async () => {
	const {metaToken, metaTokenSale} = await init(4000, web3.toWei(25000, "ether"), web3.toWei(10000, "ether"), accounts[1], now, now+10000)
	assert.equal(await metaTokenSale.wallet(), accounts[1])
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
})



