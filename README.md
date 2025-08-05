# Equipment Rental System - Complete Implementation Guide

## Overview
This is a complete Equipment Rental System for the Aptos blockchain with React frontend and Move backend, designed for a one-day bootcamp with basic functionality.

## Project Structure
```
├── contract/
│   ├── Move.toml
│   └── sources/rental.move
├── frontend/
│   ├── components/
│   │   ├── EquipmentList.tsx
│   │   ├── AddEquipment.tsx
│   │   ├── MyRentals.tsx
│   │   └── ui/
│   └── App.tsx
└── README.md
```

## Quick Start Guide

### Phase 1: Move Smart Contract Setup

1. **Install Aptos CLI**:
```bash
curl -fsSL https://aptos.dev/scripts/install_cli.py | python3
```

2. **Configure Aptos CLI**:
```bash
aptos init
```

3. **Compile and Test Contract**:
```bash
cd contract
aptos move compile
aptos move test
```

### Phase 2: Frontend Setup

1. **Install Dependencies**:
```bash
npm install
```

2. **Configure Environment Variables**:
Create `.env` file:
```bash
VITE_MODULE_ADDRESS=0x123
VITE_STORE_ADDRESS=0x123
```

3. **Start Development Server**:
```bash
npm run dev
```

### Phase 3: Deployment

1. **Deploy Smart Contract**:
```bash
cd contract
aptos move publish --named-addresses sandeep_addr=0x123
```

2. **Configure Environment**:
```bash
cp .env.example .env
# Edit .env with your actual addresses
```

3. **Start Development Server**:
```bash
npm run dev
```

### Phase 4: Usage

1. **Initialize Store**:
```bash
aptos move run --function-id 0x123::rental::initialize
```

2. **Add Equipment**:
```bash
aptos move run --function-id 0x123::rental::add_equipment \
  --args string:"Camera" string:"Professional DSLR camera" u64:50 u64:200
```

3. **Browse Equipment**:
Visit the frontend at `http://localhost:3000`

4. **Rent Equipment**:
- Connect wallet
- Browse available equipment
- Enter rental days
- Confirm transaction

5. **Return Equipment**:
- Go to "My Rentals"
- Click "Return Equipment"
- Confirm transaction

## Usage Instructions

### 1. Initialize Store
```bash
aptos move run --function-id 0x123::rental::initialize
```

### 2. Add Equipment
```bash
aptos move run --function-id 0x123::rental::add_equipment \
  --args string:"Camera" string:"Professional DSLR camera" u64:50 u64:200
```

### 3. Browse Equipment
Visit the frontend at `http://localhost:3000`

### 4. Rent Equipment
- Connect wallet
- Browse available equipment
- Enter rental days
- Confirm transaction

### 5. Return Equipment
- Go to "My Rentals"
- Click "Return Equipment"
- Confirm transaction

## API Endpoints

### Move Functions
- `initialize()` - Initialize rental store
- `add_equipment(name, description, daily_rate, deposit_amount)` - Add new equipment
- `rent_equipment(store_addr, equipment_id, rental_days)` - Rent equipment
- `return_equipment(store_addr, equipment_id)` - Return equipment

### View Functions
- `get_all_equipments(store_addr)` - Get all equipment
- `get_rentals_by_renter(store_addr, renter)` - Get rentals by renter

## Testing

### Move Tests
```bash
cd contract
aptos move test
```

### Frontend Tests
```bash
npm test
```

## Troubleshooting

### Common Issues
1. **TypeScript Errors**: Ensure all dependencies are installed
2. **Wallet Connection**: Check wallet adapter configuration
3. **Network Issues**: Verify Aptos network settings

### Environment Variables
```bash
VITE_MODULE_ADDRESS=0x123
VITE_STORE_ADDRESS=0x123
```

## Support
For issues or questions, please refer to the troubleshooting section or create an issue on GitHub.
