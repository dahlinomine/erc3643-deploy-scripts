const { ethers } = require('hardhat');

// Deploy ClaimTopicsRegistry and IdentityRegistry
// These are the foundation of ERC-3643 — all investor identity and claim verification flows through here
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  // 1. Deploy ClaimTopicsRegistry
  const ClaimTopicsRegistry = await ethers.getContractFactory('ClaimTopicsRegistry');
  const claimTopicsRegistry = await ClaimTopicsRegistry.deploy();
  await claimTopicsRegistry.deployed();
  console.log('ClaimTopicsRegistry:', claimTopicsRegistry.address);

  // 2. Add required claim topics (1=KYC, 2=AML)
  await claimTopicsRegistry.addClaimTopic(1); // KYC
  await claimTopicsRegistry.addClaimTopic(2); // AML
  console.log('Claim topics added: KYC (1), AML (2)');

  // 3. Deploy TrustedIssuersRegistry
  const TrustedIssuersRegistry = await ethers.getContractFactory('TrustedIssuersRegistry');
  const trustedIssuersRegistry = await TrustedIssuersRegistry.deploy();
  await trustedIssuersRegistry.deployed();
  console.log('TrustedIssuersRegistry:', trustedIssuersRegistry.address);

  // 4. Deploy IdentityRegistryStorage
  const IdentityRegistryStorage = await ethers.getContractFactory('IdentityRegistryStorage');
  const identityRegistryStorage = await IdentityRegistryStorage.deploy();
  await identityRegistryStorage.deployed();
  console.log('IdentityRegistryStorage:', identityRegistryStorage.address);

  // 5. Deploy IdentityRegistry
  const IdentityRegistry = await ethers.getContractFactory('IdentityRegistry');
  const identityRegistry = await IdentityRegistry.deploy(
    trustedIssuersRegistry.address,
    claimTopicsRegistry.address,
    identityRegistryStorage.address
  );
  await identityRegistry.deployed();
  console.log('IdentityRegistry:', identityRegistry.address);

  // Save addresses for next script
  const fs = require('fs');
  const addresses = {
    claimTopicsRegistry: claimTopicsRegistry.address,
    trustedIssuersRegistry: trustedIssuersRegistry.address,
    identityRegistryStorage: identityRegistryStorage.address,
    identityRegistry: identityRegistry.address
  };
  fs.writeFileSync('./deployments/step1.json', JSON.stringify(addresses, null, 2));
  console.log('Addresses saved to deployments/step1.json');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
