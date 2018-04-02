pragma solidity ^0.4.18;

import "./MetaToken.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "zeppelin-solidity/contracts/crowdsale/validation/IndividuallyCappedCrowdsale.sol";

contract MetaTokenSale is MintedCrowdsale, CappedCrowdsale, TimedCrowdsale, WhitelistedCrowdsale, IndividuallyCappedCrowdsale, RefundableCrowdsale {
    using SafeMath for uint256;

  function MetaTokenSale(ERC20 _token, uint256 _rate, uint256 _totalCap, uint256 _goal, address _wallet, uint256 _openingTime, uint256 _closingTime) public
    Crowdsale(_rate, _wallet, _token)
    CappedCrowdsale(_totalCap)
    TimedCrowdsale(_openingTime, _closingTime)
    RefundableCrowdsale(_goal)
  {
  }

  /**
   * @dev Calculates the current Rate
   */
  function currentRate() public constant returns (uint256) {
      uint256 currentRate;
      if (now < openingTime + 7 days && weiRaised < goal.mul(6).div(25)) {
          currentRate = rate.mul(6).div(5);
      } else {
          currentRate = rate.mul(19).div(20);
      }

      return currentRate;
    }



  /**
   * @dev Calculate and use the current rate to return tokens
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
    return _weiAmount.mul(currentRate());
  }
}
