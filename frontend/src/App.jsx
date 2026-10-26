import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Merchant from "./pages/Merchant";
import Customer from "./pages/Customer";
import Verifier from "./pages/Verifier";
import contractData from "./contract/DigitalReceipt.json";

export default function App() {
  // Parse initial tab from query param or hash
  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["home", "merchant", "customer", "verifier"].includes(tabParam)) {
      return tabParam;
    }
    const hash = window.location.hash.replace("#", "");
    if (hash && ["home", "merchant", "customer", "verifier"].includes(hash)) {
      return hash;
    }
    return "home";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);
  const [contract, setContract] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [warningMessage, setWarningMessage] = useState(null);

  const contractAddress = contractData?.address || "";
  const contractAbi = contractData?.abi || [];

  // Sync tab change with URL hash
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  // Check if current account is registered merchant
  const checkMerchantStatus = useCallback(async (contractInstance, userAddress) => {
    if (!contractInstance || !userAddress) {
      setIsMerchant(false);
      return;
    }
    try {
      const status = await contractInstance.isMerchant(userAddress);
      setIsMerchant(Boolean(status));
    } catch (err) {
      console.warn("Could not check merchant status:", err);
      setIsMerchant(false);
    }
  }, []);

  // Initialize read-only provider or connected contract
  const initContract = useCallback(
    async (signerOrProvider) => {
      if (!contractAddress || contractAbi.length === 0) {
        setErrorMessage("Smart contract deployment data missing. Please run deployment script.");
        return null;
      }
      try {
        const instance = new ethers.Contract(contractAddress, contractAbi, signerOrProvider);
        setContract(instance);
        return instance;
      } catch (err) {
        console.error("Contract initialization error:", err);
        return null;
      }
    },
    [contractAddress, contractAbi]
  );

  // Connect MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setErrorMessage("MetaMask is not installed! Please install MetaMask extension to use this dApp.");
      return;
    }

    setIsConnecting(true);
    setErrorMessage(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (accounts && accounts.length > 0) {
        const userAccount = accounts[0];
        setAccount(userAccount);

        const network = await provider.getNetwork();
        const cid = network.chainId.toString();
        setChainId(cid);

        // Check network recommendation (31337 Hardhat or 1337 Ganache)
        if (cid !== "31337" && cid !== "1337" && cid !== "5777") {
          setWarningMessage(
            `You are connected to Network ID ${cid}. For local development, please switch MetaMask to Hardhat Localhost (Chain ID 31337, RPC http://127.0.0.1:8545).`
          );
        } else {
          setWarningMessage(null);
        }

        const signer = await provider.getSigner();
        const contractInstance = await initContract(signer);
        if (contractInstance) {
          await checkMerchantStatus(contractInstance, userAccount);
        }
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setErrorMessage(err.message || "Failed to connect MetaMask.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Setup providers, accounts, and MetaMask listeners
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mockRole = params.get("mockRole");

    // Support for simulated demo / report screenshot view if query param is set
    if (mockRole) {
      try {
        const rpcProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        rpcProvider.getSigner(mockRole === "merchant" ? 0 : 1).then(async (signer) => {
          const signerAddress = await signer.getAddress();
          setAccount(signerAddress);
          setChainId("31337");
          const instance = await initContract(signer);
          if (instance) {
            await checkMerchantStatus(instance, signerAddress);
          }
        });
        return;
      } catch (err) {
        console.warn("Mock provider error:", err);
      }
    }

    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Check if already connected
      provider.listAccounts().then(async (accounts) => {
        if (accounts && accounts.length > 0) {
          const userAccount = accounts[0].address;
          setAccount(userAccount);

          const network = await provider.getNetwork();
          const cid = network.chainId.toString();
          setChainId(cid);

          if (cid !== "31337" && cid !== "1337" && cid !== "5777") {
            setWarningMessage(
              `You are connected to Network ID ${cid}. For local development, please switch to Hardhat Localhost (Chain ID 31337).`
            );
          }

          const signer = await provider.getSigner();
          const contractInstance = await initContract(signer);
          if (contractInstance) {
            await checkMerchantStatus(contractInstance, userAccount);
          }
        } else {
          // Fallback read-only provider to Hardhat node
          try {
            const readOnlyProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
            initContract(readOnlyProvider);
          } catch (e) {
            console.log("No local node active yet for read-only fallback.");
          }
        }
      });

      // Account change listener
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setIsMerchant(false);
        } else {
          const newAccount = accounts[0];
          setAccount(newAccount);
          const p = new ethers.BrowserProvider(window.ethereum);
          const signer = await p.getSigner();
          const instance = await initContract(signer);
          if (instance) {
            await checkMerchantStatus(instance, newAccount);
          }
        }
      };

      // Network change listener
      const handleChainChanged = (newChainId) => {
        const parsedChainId = parseInt(newChainId, 16).toString();
        setChainId(parsedChainId);
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    } else {
      // MetaMask not found, set read-only fallback
      try {
        const readOnlyProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        initContract(readOnlyProvider);
      } catch (e) {}
    }
  }, [initContract, checkMerchantStatus]);

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        account={account}
        chainId={chainId}
        isConnecting={isConnecting}
        connectWallet={connectWallet}
        isMerchant={isMerchant}
      />

      <main className="main-content">
        {/* Error notifications */}
        {errorMessage && (
          <div className="alert alert-danger">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Warning notifications */}
        {warningMessage && (
          <div className="alert alert-warning">
            <span>ℹ️ {warningMessage}</span>
          </div>
        )}

        {/* Active Tab View */}
        {activeTab === "home" && (
          <Home
            account={account}
            chainId={chainId}
            isMerchant={isMerchant}
            contractAddress={contractAddress}
            setActiveTab={handleTabChange}
            connectWallet={connectWallet}
          />
        )}

        {activeTab === "merchant" && (
          <Merchant
            account={account}
            contract={contract}
            isMerchant={isMerchant}
            setIsMerchant={setIsMerchant}
            onRefreshRole={() => checkMerchantStatus(contract, account)}
          />
        )}

        {activeTab === "customer" && (
          <Customer
            account={account}
            contract={contract}
            setActiveTab={handleTabChange}
          />
        )}

        {activeTab === "verifier" && (
          <Verifier
            contract={contract}
          />
        )}
      </main>

      <footer className="footer">
        <p>
          <strong>Blockchain-Based Digital Receipt and Purchase History Management System</strong>
        </p>
        <p style={{ marginTop: "0.25rem", fontSize: "0.75rem" }}>
          Built with Solidity ^0.8.19 • Hardhat • React • Vite • ethers.js v6 • MetaMask
        </p>
      </footer>
    </div>
  );
}
