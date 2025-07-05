const { ethers } = require("ethers");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

async function main() {
    // Get environment variables
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const scope = process.env.SCOPE;

    if (!privateKey || !rpcUrl || !contractAddress) {
        throw new Error("Please set PRIVATE_KEY, RPC_URL, and CONTRACT_ADDRESS in your .env file");
    }

    // Set up provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Contract ABI
    const contractAbi = [
        "function setScope(uint256 _scope)",
        "function scope() view returns (uint256)"
    ];

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, contractAbi, wallet);

    console.log(`\nConnected to wallet: ${wallet.address}`);
    console.log(`Using contract at: ${contractAddress}`);

    // Call the setScope function
    console.log("\nCalling setScope function...");
    const tx = await contract.setScope(scope);
    console.log(`Transaction hash: ${tx.hash}`);

    // Wait for the transaction to be mined
    await tx.wait();
    console.log("Scope has been set successfully!");

    const newScope = await contract.scope();
    console.log(`\nNew scope value on-chain: ${newScope.toString()}`);

    if (newScope.eq(scope)) {
        console.log("On-chain scope matches the script's scope. Verification successful!");
    } else {
        console.error("Error: On-chain scope does not match the script's scope!");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 