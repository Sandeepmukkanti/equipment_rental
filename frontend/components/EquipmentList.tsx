import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { AptosClient } from "aptos";

interface Equipment {
    owner: string;
    name: string;
    daily_rate: bigint;
    deposit_amount: bigint;
    is_available: boolean;
}

export function EquipmentList() {
    const { account, signAndSubmitTransaction } = useWallet();
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [rentalDays, setRentalDays] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [walletConnected, setWalletConnected] = useState<boolean>(false);

    // Check wallet connection status
    useEffect(() => {
        const checkWallet = async () => {
            if (account?.address) {
                try {
                    const client = new AptosClient("https://fullnode.devnet.aptoslabs.com");
                    const resources = await client.getAccountResources(account.address);
                    console.log("Wallet connection check - Account resources:", resources);
                    setWalletConnected(true);
                } catch (error) {
                    console.error("Error checking wallet:", error);
                    setWalletConnected(false);
                    toast.error("Wallet Connection Error", {
                        description: "Please make sure you're connected to Devnet"
                    });
                }
            } else {
                setWalletConnected(false);
            }
        };

        checkWallet();
    }, [account]);

    const fetchEquipment = async () => {
        try {
            console.log("Fetching equipment...");
            setLoading(true);
            
            const moduleAddress = import.meta.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS;
            if (!moduleAddress) {
                throw new Error("Module address not found in environment variables");
            }

            // Create Aptos client instance
            const client = new AptosClient("https://fullnode.devnet.aptoslabs.com");
            
            // Fetch all equipment resources
            const response = await client.getAccountResources(moduleAddress);
            console.log("All resources:", response);

            // Filter equipment resources - only look for Equipment type
            const equipmentResources = response.filter(
                (resource: any) => 
                    resource.type === `${moduleAddress}::rental::Equipment`
            );

            console.log("Equipment resources:", equipmentResources);
            
            // Transform and validate the data
            const processedEquipment = equipmentResources.map((resource: any) => {
                const data = resource.data;
                console.log("Processing equipment item:", data);
                
                try {
                    // Extract equipment data using the field names from Move contract
                    const equipment = {
                        owner: resource.type.split("::")[0], // The address that owns the resource
                        name: data.name,
                        daily_rate: BigInt(data.daily_rate),
                        deposit_amount: BigInt(data.deposit_amount),
                        is_available: data.is_available // Using the field directly from the contract
                    };

                    // Validate required fields
                    if (!equipment.owner || !equipment.name || equipment.daily_rate <= BigInt(0)) {
                        console.error("Invalid equipment data:", equipment);
                        return null;
                    }

                    console.log("Processed equipment:", equipment);
                    return equipment;
                } catch (error) {
                    console.error("Error processing equipment item:", error);
                    return null;
                }
            }).filter(Boolean) as Equipment[];
            
            console.log("Processed equipment:", processedEquipment);
            setEquipment(processedEquipment);
        } catch (error) {
            console.error("Error fetching equipment:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchEquipment();

        // Poll for updates every 10 seconds
        const interval = setInterval(fetchEquipment, 10000);

        // Cleanup on unmount
        return () => clearInterval(interval);
    }, []);

    const handleRent = async (owner: string) => {
        if (!account) {
            toast.error("Please connect your wallet first");
            return;
        }

        if (rentalDays < 1) {
            toast.error("Please enter a valid number of rental days");
            return;
        }

        try {
            const toastId = toast.loading("Processing your rental request...");

            const moduleAddress = import.meta.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS;
            if (!moduleAddress) {
                throw new Error("Module address not found");
            }

            // Convert rentalDays to a valid u64 number
            const daysAsNumber = Number(rentalDays);
            if (isNaN(daysAsNumber) || daysAsNumber <= 0 || !Number.isInteger(daysAsNumber)) {
                throw new Error("Invalid number of days");
            }

            console.log("Step 1 - Preparing transaction with days:", daysAsNumber);
            console.log("Step 2 - Module address:", moduleAddress);
            
            // Find the equipment being rented
            const equipmentToRent = equipment.find(e => e.owner === owner);
            console.log("Step 3 - Found equipment:", equipmentToRent);
            
            if (!equipmentToRent) {
                throw new Error("Equipment not found");
            }

            // Convert days to correct format and validate
            const daysStringValue = daysAsNumber.toString();
            
            const txPayload = {
                data: {
                    function: `${moduleAddress}::rental::rent_equipment`,
                    typeArguments: [],
                    functionArguments: [owner, daysStringValue]
                }
            };
            
            console.log("Step 4 - Transaction payload:", JSON.stringify(txPayload, null, 2));
            console.log("Step 5 - Current account:", account);
            
            // Submit transaction with proper parameter formatting
            const response = await signAndSubmitTransaction({
                data: {
                    function: `${moduleAddress}::rental::rent_equipment`,
                    typeArguments: [],
                    functionArguments: [
                        owner,
                        daysStringValue
                    ]
                }
            });
            
            console.log("Step 6 - Transaction submitted:", response);

            // Wait for transaction confirmation
            if (response?.hash) {
                console.log("Step 7 - Transaction hash:", response.hash);
                const client = new AptosClient("https://fullnode.devnet.aptoslabs.com");
                console.log("Step 8 - Waiting for transaction confirmation...");
                await client.waitForTransaction(response.hash);
                console.log("Step 9 - Transaction confirmed!");
            }

            toast.success("Equipment rented successfully!", { id: toastId });
            console.log("Step 10 - Refreshing equipment list...");
            await fetchEquipment(); // Refresh the list
        } catch (error: any) {
            console.error("==== Error Details ====");
            console.error("Error type:", typeof error);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            
            // Handle specific error cases
            if (error.message?.includes("insufficient balance")) {
                toast.error("Insufficient balance to rent this equipment");
            } else if (error.message?.includes("rejected")) {
                toast.error("Transaction rejected by wallet");
            } else if (error.message?.includes("Invalid number")) {
                toast.error(error.message);
            } else if (error.message?.includes("Cannot borrow")) {
                toast.error("Equipment is already rented or not available");
            } else if (error.message?.includes("simulation failed")) {
                toast.error("Transaction simulation failed. Please check if you have enough balance for rent and deposit.");
            } else {
                // Log the full error for debugging
                console.error("Detailed error:", {
                    message: error.message,
                    stack: error.stack,
                    data: error.data
                });
                toast.error("Failed to rent equipment. Please check console for details.");
            }
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold text-slate-900">Available Equipment</h2>
                    {walletConnected ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                            </svg>
                            Wallet Connected
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-yellow-400" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                            </svg>
                            Wallet Not Connected
                        </span>
                    )}
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                    </svg>
                </div>
            </div>
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {equipment.length === 0 ? (
                        <div className="col-span-full text-center py-8">
                            <div className="mx-auto h-12 w-12 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </div>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No equipment available</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by listing your first equipment.</p>
                        </div>
                    ) : (
                        equipment.map((item, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 transition-all duration-200">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.is_available ? 'Available' : 'Rented'}
                                    </span>
                                </div>
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-gray-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm">Daily Rate: {item.daily_rate.toString()} APT</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                        </svg>
                                        <span className="text-sm">Security Deposit: {item.deposit_amount.toString()} APT</span>
                                    </div>
                                </div>
                                {item.is_available && (
                                    <div className="mt-4 space-y-4">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={rentalDays}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const value = Number(e.target.value);
                                                if (value > 0 && value <= 365) {
                                                    setRentalDays(value);
                                                }
                                            }}
                                            className="w-full"
                                            placeholder="Number of days (1-365)"
                                        />
                                        <Button
                                            onClick={() => handleRent(item.owner)}
                                            disabled={!walletConnected}
                                            className={`w-full ${walletConnected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'} text-white`}
                                        >
                                            {walletConnected ? 'Rent Now' : 'Connect Wallet to Rent'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
