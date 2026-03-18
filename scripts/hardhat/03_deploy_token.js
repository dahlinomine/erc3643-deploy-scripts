const { ethers } = require('hardhat');
const step2 = require('../../deployments/step2.json');

// Deploy the ERC-3643 Token and wire it to IdentityRegistry + ModularCompliance
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying token with:', deployer.address);

  const Token = await ethers.getContractFactory('Token');
  const token = await Token.deploy(
    step2.identityRegistry,
    step2.compliance,
    'RWA Security Token',  // name
    'RWASC',               // symbol
    18,                    // decimals
    ethers.constants.AddressZero  // ONCHAINID for the token itself (optional)
  );
  await token.deployed();
  console.log('Token:', token.address);

  // Bind token to compliance
  await token.compliance().then(async (c) => {
    const compliance = await ethers.getContractAt('ModularCompliance', c);
    await compliance.bindToken(token.address);
  });

  // Grant agent role to deployer (allows minting)
  await token.addAgent(deployer.address);
  console.log('Agent role granted to deployer');

  const fs = require('fs');
  const addresses = { ...step2, token: token.address };
  fs.writeFileSync('./deployments/step3.json', JSON.stringify(addresses, null, 2));
  console.log('Full deployment saved to deployments/step3.json');
  console.log('\n=== Deployment Complete ===' );
  console.log('Token:', token.address);
  console.log('IdentityRegistry:', step2.identityRegistry);
  console.log('Compliance:', step2.compliance);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
