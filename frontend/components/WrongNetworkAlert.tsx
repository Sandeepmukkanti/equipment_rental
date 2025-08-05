import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";

export function WrongNetworkAlert() {
  const { network } = useWallet();
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  useEffect(() => {
    // Check if we're on the right network (devnet/testnet for development)
    if (network && !network.name.toLowerCase().includes('devnet')) {
      setIsWrongNetwork(true);
      console.log('Current network:', network.name); // Debug log
    } else {
      setIsWrongNetwork(false);
    }
  }, [network]);

  if (!isWrongNetwork) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-4 text-center">
      Please switch to Aptos Devnet to use this application
    </div>
  );
}
