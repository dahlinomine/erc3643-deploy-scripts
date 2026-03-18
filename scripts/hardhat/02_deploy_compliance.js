const { ethers } = require('hardhat');
const step1 = require('../../deployments/step1.json');

// Deploy ModularCompliance and attach transfer restriction modules
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying compliance with:', deployer.address);

  // 1. Deploy ModularCompliance
  const ModularCompliance = await ethers.getContractFactory('ModularCompliance');
  const compliance = await ModularCompliance.deploy();
  await compliance.deployed();
  console.log('ModularCompliance:', compliance.address);

  // 2. Deploy and bind MaxBalanceModule (optional — remove if not needed)
  const MaxBalanceModule = await ethers.getContractFactory('MaxBalanceModule');
  const maxBalanceModule = await MaxBalanceModule.deploy();
  await maxBalanceModule.deployed();
  await compliance.addModule(maxBalanceModule.address);
  // Set max 1,000,000 tokens per wallet
  await compliance.callModuleFunction(
    maxBalanceModule.interface.encodeFunctionData('setMaxBalance', [ethers.utils.parseEther('1000000')]),
    maxBalanceModule.address
  );
  console.log('MaxBalanceModule bound, limit: 1,000,000 tokens');

  // 3. Deploy and bind CountryRestrictModule
  const CountryRestrictModule = await ethers.getContractFactory('CountryRestrictModule');
  const countryRestrictModule = await CountryRestrictModule.deploy();
  await countryRestrictModule.deployed();
  await compliance.addModule(countryRestrictModule.address);
  // Restrict Iran (364), North Korea (408), Syria (760)
  await compliance.callModuleFunction(
    countryRestrictModule.interface.encodeFunctionData('addCountryRestriction', [364]),
    countryRestrictModule.address
  );
  console.log('CountryRestrictModule bound, OFAC-aligned restrictions applied');

  const fs = require('fs');
  const addresses = {
    ...step1,
    compliance: compliance.address,
    maxBalanceModule: maxBalanceModule.address,
    countryRestrictModule: countryRestrictModule.address
  };
  fs.mkdirSync('./deployments', { recursive: true });
  fs.writeFileSync('./deployments/step2.json', JSON.stringify(addresses, null, 2));
  console.log('Addresses saved to deployments/step2.json');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
