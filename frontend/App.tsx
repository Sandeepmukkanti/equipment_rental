import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { AddEquipment } from "./components/AddEquipment";
import { EquipmentList } from "./components/EquipmentList";

const wallets = [new PetraWallet()];

function App() {
    return (
        <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
            <div className="min-h-screen bg-gray-100">
                <nav className="bg-white shadow p-4">
                    <div className="container mx-auto flex justify-between items-center">
                        <h1 className="text-xl font-bold">Equipment Rental System</h1>
                        <WalletSelector />
                    </div>
                </nav>
                <main className="container mx-auto py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <AddEquipment />
                        <EquipmentList />
                    </div>
                </main>
            </div>
        </AptosWalletAdapterProvider>
    );
}

export default App;
