import {ethers} from 'hardhat';


const main = async()=>{
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with ${deployer.address}`);

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockDai = await MockERC20.deploy("MockDai", "mDai");
    console.log(`MockDai address is: ${mockDai.address}`);

    const CrtToken = await ethers.getContractFactory("Carrot");
    const crtToken = await CrtToken.deploy();
    console.log(`Carrot Token address is: ${crtToken.address}`);

    const CrtFarm = await ethers.getContractFactory("CarrotFarm");
    const crtFarm = await CrtFarm.deploy(mockDai.address, crtToken.address);
    console.log(`CarrotFarm address is: ${crtFarm.address}`);

    await crtToken._transferOwnership(crtFarm.address);
    console.log(`Carrot Token ownership transferred to: ${crtFarm.address} (crtFarm address)`);


}

main()
    .then(()=> process.exit(0))
    .catch(error=>{
        console.log(error)
        process.exit(1)
})