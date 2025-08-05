import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AptosClient } from "aptos";

export function AddEquipment() {
    const { account, signAndSubmitTransaction } = useWallet();
    const [name, setName] = useState("");
    const [dailyRate, setDailyRate] = useState("");
    const [depositAmount, setDepositAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Enhanced wallet connection check
        if (!account?.address) {
            console.log("No wallet connected. Account state:", account);
            toast.error("Please connect your wallet first", {
                description: "Click the 'Connect Wallet' button in the top right corner"
            });
            return;
        }

        // Verify we're on devnet
        try {
            const client = new AptosClient("https://fullnode.devnet.aptoslabs.com");
            const resources = await client.getAccountResources(account.address);
            console.log("Wallet check - Account resources:", resources);
        } catch (error) {
            console.error("Error checking account:", error);
            toast.error("Error checking wallet connection", {
                description: "Please make sure you're connected to Devnet"
            });
            return;
        }

        if (!name || !dailyRate || !depositAmount) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            setIsSubmitting(true);
            toast.loading("Listing your equipment...");
            
            const moduleAddress = import.meta.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS;
            if (!moduleAddress) {
                throw new Error('Module address not found in environment variables');
            }
            
            console.log("Submitting transaction with values:", {
                moduleAddress,
                name,
                dailyRate,
                depositAmount
            });

            // Validate numbers
            const rate = Number(dailyRate);
            const deposit = Number(depositAmount);
            
            if (isNaN(rate) || isNaN(deposit)) {
                throw new Error("Invalid number format for rate or deposit");
            }

            if (rate <= 0 || deposit <= 0) {
                throw new Error("Rate and deposit must be greater than 0");
            }

            // Convert APT to Octas (1 APT = 100_000_000 Octas)
            const rateInOctas = Math.floor(rate * 100_000_000).toString();
            const depositInOctas = Math.floor(deposit * 100_000_000).toString();

            // Validate the values are within u64 range
            if (rate <= 0 || deposit <= 0 || 
                rate > 100_000 || // Reasonable maximum in APT
                deposit > 1_000_000) { // Reasonable maximum in APT
                throw new Error("Values must be positive and within reasonable range");
            }

            console.log("Transaction details:", {
                function: `${moduleAddress}::rental::list_equipment`,
                name: name,
                rateInOctas: rateInOctas,
                depositInOctas: depositInOctas
            });

            const tx = await signAndSubmitTransaction({
                data: {
                    function: `${moduleAddress}::rental::list_equipment`,
                    typeArguments: [],
                    functionArguments: [
                        name,
                        rateInOctas,
                        depositInOctas
                    ]
                }
            });
            
            console.log("Transaction submitted:", tx);

            // Wait for transaction to be confirmed
            const client = new AptosClient("https://fullnode.devnet.aptoslabs.com");
            await client.waitForTransaction(tx.hash);

            toast.success("Equipment listed successfully!");

            // Reset form
            setName("");
            setDailyRate("");
            setDepositAmount("");
        } catch (error: any) {
            setIsSubmitting(false);
            console.error("Error listing equipment:", error);
            
            // Handle specific error cases
            if (error.message?.includes("insufficient balance")) {
                toast.error("Insufficient balance to perform this transaction");
            } else if (error.message?.includes("rejected")) {
                toast.error("Transaction rejected by wallet");
            } else if (error.message?.includes("Invalid number")) {
                toast.error(error.message);
            } else {
                toast.error("Failed to list equipment. Please try again.");
            }
            
            // Log detailed error for debugging
            if (error.stack) {
                console.debug("Error stack:", error.stack);
            }
            if (error.data) {
                console.debug("Error data:", error.data);
            }
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">List New Equipment</h2>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">Equipment Name</Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="e.g., Professional Camera"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        className="w-full"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dailyRate" className="text-sm font-medium text-slate-700">Daily Rate (APT)</Label>
                    <Input
                        id="dailyRate"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={dailyRate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDailyRate(e.target.value)}
                        className="w-full"
                        required
                    />
                    <p className="text-sm text-slate-500">Set your daily rental price in APT</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="deposit" className="text-sm font-medium text-slate-700">Security Deposit (APT)</Label>
                    <Input
                        id="deposit"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositAmount(e.target.value)}
                        className="w-full"
                        required
                    />
                    <p className="text-sm text-slate-500">Required security deposit amount</p>
                </div>
                <Button 
                    type="submit" 
                    disabled={!account || isSubmitting}
                    className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2
                        ${isSubmitting 
                            ? 'bg-blue-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                >
                    {isSubmitting && (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {!account ? "Connect Wallet to List" : isSubmitting ? "Listing Equipment..." : "List Equipment"}
                </Button>
            </form>
        </div>
    );
}
