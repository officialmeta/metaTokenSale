pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

contract MetaToken is MintableToken {
    string public constant name = "MetaToken";
    string public constant symbol = "XMT";
    uint8 public constant decimals = 18;

}
