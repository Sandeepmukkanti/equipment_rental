require("dotenv").config();
const { Move } = require("@aptos-labs/aptos-cli");

async function compile() {

  if (!process.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS) {
    throw new Error(
      "VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS variable is not set, make sure you have set the publisher account address",
    );
  }

  const move = new Move();

  await move.compile({
    packageDirectoryPath: "../../contract",
    namedAddresses: {
      // Compile module with account address
      sandeep_addr: process.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS,
    },
  });
}
compile();
