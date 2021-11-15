import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { time } from "@openzeppelin/test-helpers";

describe("crtFarm", ()=>{
    let owner: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let res: any;
    let crtFarm: Contract;
    let crtToken: Contract;
    let mockDai: Contract;

    const daiAmount: BigNumber = ethers.utils.parseEther("25000");

    beforeEach(async()=>{
        const CrtFarm = await ethers.getContractFactory("CarrotFarm");
        const CrtToken = await ethers.getContractFactory("Carrot");
        const MockDai = await ethers.getContractFactory("MockERC20");

        mockDai = await MockDai.deploy("MockDai", "mDAI");
        [owner, alice, bob] = await ethers.getSigners();
        await Promise.all([
            mockDai.mint(owner.address, daiAmount),
            mockDai.mint(alice.address, daiAmount),
            mockDai.mint(bob.address, daiAmount)
        ]);
        crtToken = await CrtToken.deploy();
        crtFarm = await CrtFarm.deploy(mockDai.address, crtToken.address);
    })

    describe("Init", ()=>{
        it("should initialise", async()=>{
            expect(crtToken).to.be.ok;
            expect(crtFarm).to.be.ok;
            expect(mockDai).to.be.ok;
        })
    });

    describe("Staking", async ()=>{
        it("should accept DAI and update mapping", async()=>{
            let toTransfer = ethers.utils.parseEther("100");
            await mockDai.connect(alice).approve(crtFarm.address, toTransfer);
            expect(await crtFarm.connect(alice).getIsStaking()).to.eq(false);
            expect(await crtFarm.connect(alice).stake(toTransfer)).to.be.ok;
            expect(await crtFarm.connect(alice).getStakeBal()).to.eq(toTransfer);
            expect(await crtFarm.connect(alice).getIsStaking()).to.eq(true);
        })

        it("should update balance with multiple stakes", async()=>{
            let toTransfer = ethers.utils.parseEther("100");
            let expectedRes = ethers.utils.parseEther("200");

            await mockDai.connect(alice).approve(crtFarm.address, toTransfer);
            await crtFarm.connect(alice).stake(toTransfer);
            await mockDai.connect(alice).approve(crtFarm.address, toTransfer);
            await crtFarm.connect(alice).stake(toTransfer);

            expect(await crtFarm.connect(alice).getStakeBal()).to.eq(expectedRes);
        })

        it("should revert with no enough funds", async()=>{
            let toTransfer = ethers.utils.parseEther("1000000");
            await mockDai.approve(crtFarm.address, toTransfer)

            await expect(crtFarm.connect(alice).stake(toTransfer)).to.be.revertedWith("You cannot stake zero tokens");
            await expect(crtFarm.connect(bob).stake(0)).to.be.revertedWith("You cannot stake zero tokens");
        })

        it("should revert without allowance", async()=>{
            let toTransfer = ethers.utils.parseEther("100");
            let allowance = ethers.utils.parseEther("80");

            await mockDai.connect(bob).approve(crtFarm.address, allowance);
            // expect(await crtFarm.connect(bob).stake(toTransfer)).to.be.reverted;
            await expect(crtFarm.connect(bob).stake(toTransfer)).to.be.revertedWith("ERC20: transfer amount exceeds allowance")
        })
    });
    describe("Unstake", async()=>{

        

        beforeEach(async()=>{
            let toTransfer = ethers.utils.parseEther("100");
            await mockDai.connect(alice).approve(crtFarm.address, toTransfer);
            await crtFarm.connect(alice).stake(toTransfer);
        })

        it("should unstake balance from user", async()=>{
            let toTransfer = ethers.utils.parseEther("100");
            expect(await crtFarm.connect(alice).getStakeBal()).to.eq(toTransfer);

            await crtFarm.connect(alice).unstake(toTransfer);
            
            expect(await crtFarm.connect(alice).getStakeBal()).to.eq(0);
            await expect(crtFarm.connect(alice).unstake(toTransfer)).to.be.revertedWith("Nothing to unstake");
            
        })

        it("should show the correct balance after partially unstaked", async()=>{
            let toTransfer = ethers.utils.parseEther("60");
            let expectedRes = ethers.utils.parseEther("40");
            await crtFarm.connect(alice).unstake(toTransfer);
            
            expect(await crtFarm.connect(alice).getStakeBal()).to.eq(expectedRes);
        })

        it("isStaking mapping should be true when partially unstaked", async()=>{
            let toTransfer = ethers.utils.parseEther("60");
            await crtFarm.connect(alice).unstake(toTransfer);
            expect(await crtFarm.connect(alice).getIsStaking()).to.eq(true);
        })
    })

    describe("WithdrawYield", async()=>{

        beforeEach(async()=>{
            await crtToken._transferOwnership(crtFarm.address)
            let toTransfer = ethers.utils.parseEther("10");
            await mockDai.connect(alice).approve(crtFarm.address, toTransfer);
            await crtFarm.connect(alice).stake(toTransfer);
        })

        it("should return the correct yield time", async()=>{

            let timeStart = await crtFarm.connect(alice).getStartTime();
            expect(Number(timeStart)).to.be.greaterThan(0)

            await time.increase(86400);
            expect(await crtFarm.calculateYieldTime(alice.address)).to.eq((86400))

        })

        it("should mint correct token amount in total supply and user", async()=>{
            await time.increase(86400);

            let _time = await crtFarm.calculateYieldTime(alice.address);
            let formatTime = _time/86400;
            let staked = await crtFarm.connect(alice).getStakeBal();

            let bal = staked * formatTime;
            let newBal = ethers.utils.formatEther(bal.toString());
            let expected = Number.parseFloat(newBal).toFixed(3);

            await crtFarm.connect(alice).withdrawYield();

            res = await crtToken.totalSupply();
            let newRes = ethers.utils.formatEther(res);
            let formatRes = Number.parseFloat(newRes).toFixed(3).toString();

            expect(expected).to.eq(formatRes);

            res = await crtToken.totalSupply();
            newRes = ethers.utils.formatEther(res);
            formatRes = Number.parseFloat(newRes).toFixed(3).toString();

            expect(expected).to.eq(formatRes);

        })

        it("should update yield balance when unstaked", async()=>{
            // let toTransfer = ethers.utils.parseEther("5")
            await time.increase(86400);
            await crtFarm.connect(alice).unstake(ethers.utils.parseEther("5"));

            res = await crtFarm.connect(alice).getStakeBal();
            expect(Number(ethers.utils.formatEther(res))).to.be.approximately(5, .001);
        })
    })




})

//  When testing smart contracts, Chai allows for numerous different setups. 
//  The two that I use most include the before() and beforeEach() hooks. 
//  The beforeEach() hook executes the entire code block before each test case. 
//  This provides excellent coverage for smaller unit testing. 
//  You can save some time with testing if you use the before() hook; as, 
//  the code block runs only once before the first test. 
//  All tests thereafter share the same state. In other words, 
//  if you send 5 ETH from Alice to Bob in test case #1 and don’t move it, 
//  Bob will still hold the 5 ETH in all subsequent test cases within the initial 
//  describe umbrella mentioned above.