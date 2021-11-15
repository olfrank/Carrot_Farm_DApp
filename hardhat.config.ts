
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3"
require('dotenv').config();
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.4",
  },
  networks:{
    kovan:{
      url: process.env.KOVAN_KEY,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    }
  } 
};
   