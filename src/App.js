import './App.css';
import { ethers } from "ethers";
import { useState, useEffect , useCallback} from 'react';
import styled from "styled-components";
import Farm from '../artifacts/contracts/carrotFarm.sol/CarrotFarm.json';
import Carrot from '../artifacts/contracts/carrotToken.sol/CarrotToken.json';

const farmAddress = "";
const carrotAddress = "";

const KovanKey = process.env.KOVAN_KEY;
const account = process.env.PRIVATE_KEY;

const Container = styled.div`
    width: 100%;
    height: 75rem;
`;

function App() {
  // *** contracts states
  const [provider, setProvider] = useState("");
  const [daiContract, setDaiContract] = useState("");
  const [carrotContract, setCarrotContract] = useState("");
  const [farmContract, setFarmContract] = useState("");
  const [init, setInit] = useState(false);

  const contractStates = {
    provider, 
    setProvider, 
    daiContract, 
    setDaiContract, 
    carrotContract, 
    setCarrotContract, 
    farmContract, 
    setFarmContract, 
    init, 
    setInit
  }
  

  // *** user states 
  const [userAddress, setUserAddress] = useState("");
  const [ethBalance, setEthBalance] = useState("");
  const [daiBalance, setDaiBalance] = useState("");
  const [crtBalance, setCrtBalance] = useState("");
  const [stakingBalance, setStakingBalance] = useState("");
  const [crtYield, setCrtYield] = useState("");
  const [crtUnrealizedYield, setCrtUnrealizedYield] = useState("");

  const userStates = {
    userAddress, 
    setUserAddress, 
    ethBalance, 
    setEthBalance, 
    daiBalance, 
    setDaiBalance, 
    crtBalance, 
    setCrtBalance, 
    stakingBalance, 
    setStakingBalance, 
    crtYield, 
    setCrtYield, 
    crtUnrealizedYield, 
    setCrtUnrealizedYield
  }


  // *** contracts - fetchStates
  const loadProvider = useCallback(async ()=>{
    let provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);
    return provider;

  },[setProvider]);

  const loadDaiContract = useCallback(async(_provider)=>{
    let daiAddress = "";
    let contract = await ethers.Contract(daiAddress, _provider);
    setDaiContract[contract];
  }, [setDaiContract])

  const loadCarrotContract = useCallback(async(_provider)=>{
    let crtAddress = "";
    let contract = await ethers.Contract(crtAddress, Carrot.abi, _provider);
    setCarrotContract[contract];
  }, [setCarrotContract]);

  const loadFarmContract = useCallback(async(_provider)=>{
    let farmAddress = "";
    let contract = await ethers.Contract(farmAddress, Farm.abi, _provider);
    setFarmContract[contract];
  }, [setFarmContract]);


  // *** contract loadStates
  const componentDidMount = useCallback(async(_provider)=>{

    await loadProvider().then(async(res)=>{
      await loadDaiContract(res);
      await loadFarmContract(res);
      await loadCarrotContract(res);
    })
    setInit(true);

  },[
    loadDaiContract, 
    loadFarmContract, 
    loadCarrotContract, 
    setInit
  ]);

  useEffect(()=>{
    try{
      if(init === false){
        componentDidMount();
      }
    }catch (error){
      console.log(error);
    }
    
  }, [componentDidMount]);

  const loadUserAddress = useCallback(async()=>{
    let account = provider.getSigner();
    let address = await account.getAddress();
    return address;
  }, [provider]);

  const loadEthBalance = useCallback(async(user)=>{
    let balance = await provider.getBalance(user);
    setEthBalance[balance];

  }, [provider, setEthBalance]);

  const loadDaiBalance = useCallback(async(user)=>{
    let balance = await daiContract.balanceOf(user);
    setDaiBalance[balance];
  }, [daiContract, setDaiBalance]);

  const loadCrtBalance = useCallback(async(user)=>{
    let balance = await carrotContract.balanceOf(user);
    setCrtBalance[balance];
  }, [carrotContract, setCrtBalance]);

  const loadStakingBalance = useCallback(async(user)=>{
    let balance = await farmContract.stakingBalance(user);
    setStakingBalance[balance];
  },[farmContract, setStakingBalance]);

  const loadUnrealisedYield = useCallback(async(user)=>{
    let _yield = await farmContract.crtBalance(user);
    setCrtUnrealizedYield[_yield];
  }, [farmContract, setCrtUnrealizedYield]);

  const loadCrtYield = useCallback(async(user)=>{
    let _yield = await farmContract.calculateYield(user);
    setCrtYield[_yield];

  }, [farmContract, setCrtYield]);


  const userDidMount = useCallback( async ()=>{
    try{
      await loadUserAddress().then(res =>{
        setUserAddress(res);
        loadEthBalance(res);
        loadDaiBalance(res);
        loadCrtBalance(res);
        loadStakingBalance(res);
        loadUnrealisedYield(res);
        loadCrtYield(res);
      })

    } catch(error){
        console.log(error);
    }
  }, [
      loadCrtYield, 
      loadDaiBalance, 
      loadEthBalance, 
      loadStakingBalance, 
      loadUnrealisedYield, 
      loadCrtBalance
    ]);



  useEffect(()=>{
    try{
      if(userAddress = "" && init === true){
        userDidMount();
      }
    }catch (error){
      console.log(error);
    }
  }, [userDidMount, init, userAddress]);



 useEffect(()=>{
   if(userAddress != ""){
      farmContract.on("Stake", async(userAddress)=>{
        await loadDaiBalance(userAddress);
        await loadStakingBalance(userAddress);
      })
      farmContract.on("Unstake", async(userAddress)=>{
        await loadDaiBalance(userAddress);
        await loadStakingBalance(userAddress);
      })
      farmContract.on("YieldWithdraw", async(userAddress)=>{
        await loadUnrealisedYield(userAddress);
        await loadCrtYield(userAddress);
        await loadCrtBalance(userAddress);
      })
   }

   if(stakingBalance > 0){
    let interval = null;
    interval = setInterval(()=>{
      loadCrtYield(userAddress);
    }, 20000)
    return () => clearInterval(interval);
  }

 }, [
  loadDaiBalance, 
  loadStakingBalance, 
  loadUnrealisedYield, 
  loadCrtYield, 
  loadCrtBalance, 
  farmContract, 
  userAddress
])

 










  return (
    <Container>
      <ContractProvider value={contractStates}>
        <UserProvider value={userStates}>
          <Main />
        </UserProvider>
      </ContractProvider>
    </Container>
  );
}

export default App;
