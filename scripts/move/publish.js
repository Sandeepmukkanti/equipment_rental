require("dotenv").config();
const fs = require("node:fs");
const { execSync } = require("child_process");
const path = require("path");

async function publish() {
  if (!process.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS) {
    throw new Error(
      "VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS variable is not set"
    );
  }

  if (!process.env.VITE_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY) {
    throw new Error(
      "VITE_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY variable is not set"
    );
  }

  const contractPath = path.resolve(__dirname, "../../contract");
  const envPath = path.resolve(__dirname, "../../.env");
  
  try {
    // First compile the contract
    console.log("Compiling contract...");
    execSync("aptos move compile", { 
      cwd: contractPath,
      stdio: 'inherit'
    });

    // Then publish
    console.log("Publishing contract...");
    execSync(
      `aptos move publish --named-addresses sandeep_addr=${process.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS} --private-key=${process.env.VITE_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY} --url=https://fullnode.devnet.aptoslabs.com`,
      { 
        cwd: contractPath,
        stdio: 'inherit'
      }
    );
    
    console.log("Contract published successfully!");

    // Update the .env file with the module address
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }

    const regex = /^VITE_MODULE_ADDRESS=.*$/m;
    const newEntry = `VITE_MODULE_ADDRESS=${process.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS}`;

    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, newEntry);
    } else {
      envContent += `\n${newEntry}`;
    }

    fs.writeFileSync(envPath, envContent, "utf8");
    console.log("Updated .env file with module address");

  } catch (error) {
    console.error("Error publishing contract:", error);
    process.exit(1);
  }
}

publish();
