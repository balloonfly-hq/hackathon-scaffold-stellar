# BalloonFly Smart Contract

Soroban smart contract powering the BalloonFly provably-fair crash game on the Stellar network.

## Source Files

- `src/lib.rs`: Core contract logic, round lifecycle (`create_round`, `start_round`, `cash_out`, `end_round`), and multiplier calculation.
- `src/error.rs`: Custom error definitions (`ContractError`) with integer representations.
- `src/storage.rs`: Storage key abstractions (`DataKey`) and ledger persistence helpers.
- `src/types.rs`: Data models including `Round`, `Bet`, `GameConfig`, and round status enums.
- `src/test.rs`: Unit test suite testing round lifecycle, bet placement, cashouts, and edge conditions.

## Building and Testing

From the repository root:

```bash
# Build contract to WASM
stellar contract build

# Run Rust tests
cargo test --manifest-path contracts/balloonfly/Cargo.toml
```
