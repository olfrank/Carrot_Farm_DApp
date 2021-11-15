// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./carrotToken.sol";
import "hardhat/console.sol";

contract CarrotFarm {
    //userAddress => stakingBal
    mapping(address => uint256) stakingBalance;
    mapping(address => bool) public isStaking;
    mapping(address => uint256) public startTime;
    mapping(address=> uint256) public crtBalance;

    string public name = "TokenFarm";

    IERC20 public daiToken;
    Carrot public crtToken;

    event Stake(address indexed from, uint256 amount);
    event Unstake(address indexed from, uint256 amount);
    event YieldWithdraw(address indexed to, uint256 amount);

    constructor(IERC20 _daiToken, Carrot _crtToken){
        daiToken = _daiToken;
        crtToken = _crtToken;
    }


    //********** Core function shells ***********

    function stake(uint256 amount) public {
        require(amount > 0 && daiToken.balanceOf(msg.sender) >= amount, "You cannot stake zero tokens");

        if(isStaking[msg.sender] == true){
            uint256 toTransfer = calculateYield(msg.sender);
            crtBalance[msg.sender] += toTransfer;
        }

        daiToken.transferFrom(msg.sender, address(this), amount);
        stakingBalance[msg.sender] += amount;
        startTime[msg.sender] = block.timestamp;
        isStaking[msg.sender] = true;

        emit Stake(msg.sender, amount);
    }

    function unstake(uint256 amount) public {
        require(isStaking[msg.sender] == true && stakingBalance[msg.sender] >= amount, "Nothing to unstake");
        uint256 yield = calculateYield(msg.sender);
        startTime[msg.sender] = block.timestamp;
        uint256 toUnstake = amount;
        amount = 0; // to prevent re-entrancy 
        stakingBalance[msg.sender] -= toUnstake;
        daiToken.transfer(msg.sender, toUnstake);
        crtBalance[msg.sender] += yield;

        console.log("stakingBalance of %s is %s", msg.sender, stakingBalance[msg.sender]);

        if(stakingBalance[msg.sender] == 0){
            bool _isStaking = isStaking[msg.sender];
            _isStaking == false;
        }
        console.log("isStaking bool of %s is %s", msg.sender, isStaking[msg.sender]);

        emit Unstake(msg.sender, toUnstake);
    }

    function withdrawYield() public {
        uint256 toTransfer = calculateYield(msg.sender);
        require(toTransfer > 0 || crtBalance[msg.sender] > 0, "Nothing to withdraw");

        if(crtBalance[msg.sender] != 0){
            uint256 oldBalance = crtBalance[msg.sender];
            crtBalance[msg.sender] = 0;//re-entrancy blocker 
            toTransfer += oldBalance;
        }

        startTime[msg.sender] = block.timestamp;
        crtToken.mint(msg.sender, toTransfer);
        emit YieldWithdraw(msg.sender, toTransfer);
    }

    function calculateYield(address user) internal view returns(uint256){
        uint256 time = calculateYieldTime(user) * 10**18; // convert returned time value into a BigNumber for precision
        uint256 rate = 86400; //represents a day in seconds
        uint256 timeRate = time / rate; 
        uint256 rawYield = (stakingBalance[user] * timeRate) / 10**18;
        console.log("the raw yeild of %s is %s", msg.sender, rawYield);
        return rawYield;
    }


    function calculateYieldTime(address user)public view returns(uint256){ // for testing purposes this function is public
        uint256 start = startTime[user];
        uint256 end = block.timestamp;
        uint256 totalTime = end - start;
        
        return totalTime;
    }

    function _stake() internal {

    }

    function _unstake() internal {

    }

    function _withdrawYield() internal {

    }

    // ********** GETTER FUNCTIONS ***********

    function getIsStaking() public view returns(bool){
        return isStaking[msg.sender];
    }

    function getStakeBal() public view returns(uint256){
        return stakingBalance[msg.sender];
    }

    function getCrtBal() public view returns(uint256){
        return crtBalance[msg.sender];
    }

    function getStartTime()public view returns(uint256){
        return startTime[msg.sender];
    }

}
