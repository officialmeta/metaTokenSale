const MetaToken = artifacts.require('./MetaToken.sol')
const { should, EVMThrow } = require('./helpers')

contract('MetaToken', function ([owner, donor]) {
    let metaToken = await MetaToken.new(125000000000000)

    it('has an owner', async function () {
        const metaTokenOwner = await metaToken.owner()

        metaTokenOwner.should.be.equal(owner)
    })

    it('correct name', async function () {
        assert.equal(await metaToken.name(), "MetaToken")
    })

    it('correct symbol', async function () {
        assert.equal(await metaToken.symbol(), "XMT")
    })

    it('correct decimals', async function () {
        assert.equal(await metaToken.decimals(), 18)
    })


})
