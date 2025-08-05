module sandeep_addr::rental {
    use std::string::String;
    use aptos_framework::signer;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;

    /// Struct representing an equipment item
    struct Equipment has store, key {
        owner: address,
        name: String,
        daily_rate: u64,
        deposit_amount: u64,
        is_available: bool,
        renter: address,
        rental_end_time: u64
    }

    /// Error codes
    const E_NOT_AVAILABLE: u64 = 1;
    const E_INSUFFICIENT_PAYMENT: u64 = 2;
    const E_NOT_RENTED: u64 = 3;
    const E_UNAUTHORIZED: u64 = 4;

    /// Function to list new equipment for rental
    public entry fun list_equipment(
        owner: &signer,
        name: String,
        daily_rate: u64,
        deposit_amount: u64
    ) {
        let equipment = Equipment {
            owner: signer::address_of(owner),
            name,
            daily_rate,
            deposit_amount,
            is_available: true,
            renter: @0x0,
            rental_end_time: 0
        };
        move_to(owner, equipment);
    }

    /// Function to rent equipment
    public entry fun rent_equipment(
        renter: &signer,
        equipment_owner: address,
        rental_days: u64
    ) acquires Equipment {
        let equipment = borrow_global_mut<Equipment>(equipment_owner);
        assert!(equipment.is_available, E_NOT_AVAILABLE);
        
        let total_amount = equipment.daily_rate * rental_days + equipment.deposit_amount;
        let payment = coin::withdraw<AptosCoin>(renter, total_amount);
        coin::deposit(equipment_owner, payment);

        equipment.is_available = false;
        equipment.renter = signer::address_of(renter);
        equipment.rental_end_time = timestamp::now_seconds() + (rental_days * 86400);
    }
}
