# erc3643-deploy-scripts

Hardhat and Foundry deployment scripts for ERC-3643 compliant security tokens. Covers identity registry setup, compliance module configuration, token factory deployment, and transfer restriction rules.

Works with the [T-REX Protocol](https://github.com/TokenySolutions/T-REX) reference implementation.

## What's included

```
scripts/
  hardhat/
    01_deploy_identity_registry.js   # ClaimTopicsRegistry + IdentityRegistry
    02_deploy_compliance.js          # ModularCompliance + transfer restriction modules
    03_deploy_token.js               # Token factory + agent/owner roles
    04_onboard_investor.js           # Mint identity, add KYC claim, whitelist wallet
  foundry/
    Deploy.s.sol                     # Full deployment sequence in one Foundry script
    OnboardInvestor.s.sol            # Investor onboarding script
test/
  hardhat/
    ERC3643.test.js                  # End-to-end: deploy → onboard → transfer → freeze
  foundry/
    ERC3643.t.sol                    # Foundry fork test
config/
  networks.json                      # RPC endpoints and chain IDs
  compliance-rules.json             # Transfer restriction rule templates
```

## Quick Start (Hardhat)

```bash
git clone https://github.com/dahlinomine/erc3643-deploy-scripts
cd erc3643-deploy-scripts
npm install

cp .env.example .env
# Fill in PRIVATE_KEY and RPC_URL

# Deploy to local Hardhat network
npx hardhat run scripts/hardhat/01_deploy_identity_registry.js --network localhost
npx hardhat run scripts/hardhat/02_deploy_compliance.js --network localhost
npx hardhat run scripts/hardhat/03_deploy_token.js --network localhost

# Or deploy all in sequence
npx hardhat run scripts/hardhat/deploy-all.js --network localhost
```

## Quick Start (Foundry)

```bash
git clone https://github.com/dahlinomine/erc3643-deploy-scripts
cd erc3643-deploy-scripts
forge install

# Deploy to Polygon Mumbai testnet
forge script scripts/foundry/Deploy.s.sol:Deploy \
  --rpc-url $POLYGON_MUMBAI_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

## Deployment Architecture

A complete ERC-3643 deployment requires four contracts in sequence:

```
1. ClaimTopicsRegistry
   └── Defines which claim types are required (e.g., KYC=1, AML=2, Accredited=3)

2. TrustedIssuersRegistry
   └── Whitelists KYC providers authorized to issue claims

3. IdentityRegistry
   └── Maps investor wallets to ONCHAINID identity contracts
   └── Links to ClaimTopicsRegistry + TrustedIssuersRegistry

4. ModularCompliance
   └── Enforces transfer rules (max balance, country restrictions, lock periods)
   └── Links to IdentityRegistry

5. Token (ERC-3643)
   └── Links to IdentityRegistry + ModularCompliance
   └── Restricted to verified investors only
```

## Compliance Modules

The scripts support the standard T-REX compliance modules:

| Module | Purpose | Config |
|--------|---------|--------|
| `MaxBalanceModule` | Cap token holdings per wallet | `maxBalance: 1000000` |
| `CountryRestrictModule` | Block transfers to/from specific countries | `restrictedCountries: ["IR", "KP", "SY"]` |
| `TransferFeesModule` | Collect fee on each transfer | `feeBps: 50` (0.5%) |
| `TimeExchangeLimitsModule` | Limit transfer frequency | `exchangeLimit: { limitTime: 86400, limitValue: 10000 }` |
| `SupplyLimitModule` | Cap total token supply | `supplyLimit: 100000000` |

## Investor Onboarding Flow

```javascript
// scripts/hardhat/04_onboard_investor.js (simplified)

// 1. Deploy ONCHAINID identity for investor
const identity = await deployIdentityProxy(investor.address);

// 2. Issue KYC claim from trusted issuer
await identity.connect(kycProvider).addClaim(
  CLAIM_TOPIC_KYC,       // topic = 1
  CLAIM_ISSUER_SCHEME,   // scheme = 1 (ECDSA)
  kycProvider.address,   // issuer
  signature,             // signed by KYC provider
  kycData,               // off-chain verification hash
  "https://kyc.example.com/claims/123"
);

// 3. Register identity in IdentityRegistry
await identityRegistry.registerIdentity(
  investor.address,
  identity.address,
  COUNTRY_CODE_GH  // Ghana = 288
);

// 4. Token is now transferable to this investor
await token.transfer(investor.address, ethers.utils.parseEther("1000"));
```

## Networks

Pre-configured in `config/networks.json`:

| Network | Chain ID | Notes |
|---------|----------|-------|
| Hardhat local | 31337 | Default dev environment |
| Ethereum Sepolia | 11155111 | Recommended testnet |
| Polygon Mumbai | 80001 | Low-cost testnet |
| Polygon PoS | 137 | Production — significant RWA activity |
| Base Sepolia | 84532 | Base testnet |
| Base | 8453 | Growing institutional RWA ecosystem |

## Environment Variables

```bash
# .env.example
PRIVATE_KEY=0x...
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_RPC_URL=https://mainnet.base.org
ETHERSCAN_API_KEY=...
POLYGONSCAN_API_KEY=...
```

## Related

- [T-REX Protocol](https://github.com/TokenySolutions/T-REX) — The reference ERC-3643 implementation these scripts deploy
- [erc3643-compliance-toolkit](https://github.com/dahlinomine/erc3643-compliance-toolkit) — Agent configs and regulatory templates
- [rwa-compliance-checklist](https://github.com/dahlinomine/rwa-compliance-checklist) — Pre-issuance compliance checklist for RWA issuers
- [ERC-3643 Spec](https://erc3643.org) — The standard

## License

MIT