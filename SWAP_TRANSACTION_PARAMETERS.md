# Swap Transaction Parameters Analysis

## Overview
This document breaks down each parameter in the EVM swap transaction to ensure proper construction for the AssetConversion precompile.

## Transaction Object Structure

```typescript
{
  from: string;           // Sender's EVM address
  to: string;            // AssetConversion precompile address
  data: string;          // ABI-encoded function call data
  value?: string;        // Native token amount (if swapping native token)
  gas?: string;          // Gas limit (optional, can be estimated)
  gasPrice?: string;     // Legacy gas price (optional)
  maxFeePerGas?: string; // EIP-1559 max fee per gas (optional)
  maxPriorityFeePerGas?: string; // EIP-1559 priority fee (optional)
}
```

## Parameter Breakdown

### 1. `from` Parameter
- **Source**: `account.evmAddress` from MetaMask account
- **Type**: `string` (EVM H160 address)
- **Format**: `0x` + 40 hex characters
- **Example**: `"0xdF4993F7741B1295D6A9b4eced2790C2165f085c"`
- **Validation**: ✅ Correct - uses MetaMask account's EVM address

### 2. `to` Parameter
- **Source**: `EVM_PRECOMPILES.ASSET_CONVERSION`
- **Value**: `"0x0000000000000000000000000000000000000902"`
- **Type**: `string` (EVM H160 address)
- **Purpose**: AssetConversion precompile contract address
- **Validation**: ✅ Correct - matches 3Dpass AssetConversion precompile

### 3. `data` Parameter
- **Source**: ABI-encoded function call data
- **Construction Process**:
  1. Convert Substrate asset IDs to EVM addresses
  2. Create ethers.js interface with ABI
  3. Encode function call with parameters

#### ABI Function Signatures:
```solidity
// Full function with recipient and deadline
function swapWithDeadline(
  address asset_in,      // EVM address for input asset
  address asset_out,     // EVM address for output asset  
  uint256 amount,        // Amount to swap (in wei)
  uint256 min_receive,   // Minimum amount to receive (slippage protection)
  address recipient,     // Recipient address
  uint256 deadline       // Transaction deadline timestamp
) external returns (uint256);

// Simplified function without recipient and deadline
function swap(
  address asset_in,      // EVM address for input asset
  address asset_out,     // EVM address for output asset
  uint256 amount,        // Amount to swap (in wei)
  uint256 min_receive    // Minimum amount to receive (slippage protection)
) external returns (uint256);
```

#### Data Construction Steps:
1. **Asset Address Conversion**:
   - Input: Substrate asset ID (e.g., "0", "222")
   - Output: EVM H160 address
   - **Special case**: Asset ID "0" (native P3D token) → `0x0000000000000000000000000000000000000802`
   - **Other assets**: `0xFBFBFBFA` + `<asset_id_hex_padded_to_32_chars>`

2. **Function Selection**:
   - If `recipient` and `deadline` provided → use `swapWithDeadline`
   - Otherwise → use `swap`

3. **Parameter Encoding**:
   - Uses ethers.js `Interface.encodeFunctionData()`
   - Properly handles all parameter types (address, uint256)

- **Validation**: ✅ Correct - proper ABI encoding with ethers.js

### 4. `value` Parameter
- **Source**: Conditional based on input asset
- **Logic**: 
  ```typescript
  value: params.assetIn === ASSET_IDS.NATIVE ? params.amount : "0x0"
  ```
- **Purpose**: Native token amount when swapping native token
- **Values**:
  - If swapping native token (asset ID "0"): `params.amount` in wei
  - If swapping other assets: `"0x0"` (no native token transfer)
- **Validation**: ✅ Correct - only sends native token when needed

### 5. Gas Parameters

#### `gas` Parameter (Gas Limit)
- **Source**: Estimated via `eth_estimateGas` or provided manually
- **Purpose**: Maximum gas units the transaction can consume
- **Estimation**: Uses MetaMask provider to estimate actual gas needed
- **Validation**: ✅ Correct - proper gas estimation

#### `gasPrice` Parameter (Legacy)
- **Source**: `eth_gasPrice` from MetaMask provider
- **Purpose**: Gas price for legacy transactions (pre-EIP-1559)
- **Format**: Hex string in wei
- **Validation**: ✅ Correct - uses current network gas price

#### EIP-1559 Parameters
- **`maxFeePerGas`**: Maximum total fee per gas unit
- **`maxPriorityFeePerGas`**: Priority fee (tip) for miners
- **Source**: Calculated from `eth_feeHistory`
- **Calculation**:
  - Base fee from recent blocks
  - Priority fee from 50th percentile
  - Max fee = 2x base fee + priority fee (safety margin)
- **Validation**: ✅ Correct - proper EIP-1559 implementation

## Input Parameter Validation

### SwapParams Interface:
```typescript
interface SwapParams {
  assetIn: string;      // Substrate asset ID (e.g., "0", "222")
  assetOut: string;     // Substrate asset ID (e.g., "0", "222") 
  amount: string;       // Amount in wei (e.g., "1000000000000000000")
  minReceive: string;   // Minimum receive in wei (slippage protection)
  recipient?: string;   // Optional recipient EVM address
  deadline?: number;    // Optional deadline timestamp
}
```

### Validation Rules:
1. **assetIn/assetOut**: Must be valid asset IDs (can be "0" for native)
2. **amount**: Must be positive string representing wei amount
3. **minReceive**: Must be positive string representing wei amount
4. **recipient**: Optional EVM address (defaults to sender)
5. **deadline**: Optional timestamp (must be in future if provided)

## Example Transaction

### Input Parameters:
```typescript
const swapParams = {
  assetIn: "0",           // Native P3D token
  assetOut: "222",        // Asset ID 222
  amount: "1000000000000000000", // 1 P3D (18 decimals)
  minReceive: "980000000000000000", // 0.98 tokens (2% slippage)
  recipient: "0xdF4993F7741B1295D6A9b4eced2790C2165f085c",
  deadline: 1704067200    // Unix timestamp
};
```

### Asset Address Conversion:
- **Asset ID "0" (native P3D)** → `0x0000000000000000000000000000000000000802` (P3D precompile)
- **Asset ID "222"** → `0xFBFBFBFA000000000000000000000000000000DE` (standard format)

### Generated Transaction:
```typescript
{
  from: "0xdF4993F7741B1295D6A9b4eced2790C2165f085c",
  to: "0x0000000000000000000000000000000000000902",
  data: "0x12345678...", // ABI-encoded swapWithDeadline call
  value: "0xde0b6b3a7640000", // 1 P3D in wei
  gas: "0x5208", // Estimated gas limit
  maxFeePerGas: "0x5d21dba00", // EIP-1559 max fee
  maxPriorityFeePerGas: "0x5f5e100" // EIP-1559 priority fee
}
```

## Potential Issues & Recommendations

### ✅ What's Working Well:
1. **Proper ABI encoding** with ethers.js
2. **Correct asset address conversion** using 0xFBFBFBFA prefix
3. **Flexible function selection** (with/without recipient/deadline)
4. **Proper gas estimation** with EIP-1559 support
5. **Native token handling** (value parameter)

### ⚠️ Areas to Monitor:
1. **Asset ID validation** - ensure asset IDs exist on network
2. **Amount precision** - verify decimal handling for different assets
3. **Deadline validation** - ensure deadline is in future
4. **Gas estimation accuracy** - monitor actual vs estimated gas usage
5. **Network compatibility** - verify precompile address on different networks

### 🔧 Recommendations:
1. Add more comprehensive input validation
2. Implement retry logic for gas estimation failures
3. Add transaction simulation before sending
4. Consider adding slippage protection UI
5. Add support for different asset decimal places

## Conclusion
The swap transaction construction is well-implemented with proper ABI encoding, gas estimation, and parameter handling. The main components are correctly structured for interaction with the 3Dpass AssetConversion precompile.
