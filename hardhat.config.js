require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Default Hardhat in-process network
    hardhat: {
      chainId: 31337,
    },
    // Local Hardhat Node running as standalone process
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Ganache local network (if user chooses to use Ganache GUI or CLI)
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337, // Standard Ganache chainId (or 5777)
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
