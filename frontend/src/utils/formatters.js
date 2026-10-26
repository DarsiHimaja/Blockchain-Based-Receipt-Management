import { ethers } from "ethers";

/**
 * Shortens an Ethereum address to 0x1234...abcd
 */
export function shortenAddress(address) {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Formats Wei or BigInt to ETH string with up to 4 decimal places
 */
export function formatEth(wei) {
  if (!wei) return "0 ETH";
  try {
    const eth = ethers.formatEther(wei);
    const parsed = parseFloat(eth);
    return `${parsed.toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH`;
  } catch (e) {
    return `${wei} Wei`;
  }
}

/**
 * Formats UNIX timestamp (seconds) to human-readable date and time
 */
export function formatDate(timestamp) {
  if (!timestamp) return "-";
  try {
    const num = Number(timestamp);
    const date = new Date(num * 1000);
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch (e) {
    return String(timestamp);
  }
}

/**
 * Truncates a 66-character bytes32 hex string
 */
export function truncateHash(hash) {
  if (!hash) return "";
  return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
}
