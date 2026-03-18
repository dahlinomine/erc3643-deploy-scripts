// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Script.sol";
import "@tokenysolutions/t-rex/contracts/token/Token.sol";
import "@tokenysolutions/t-rex/contracts/registry/ClaimTopicsRegistry.sol";
import "@tokenysolutions/t-rex/contracts/registry/TrustedIssuersRegistry.sol";
import "@tokenysolutions/t-rex/contracts/registry/IdentityRegistry.sol";
import "@tokenysolutions/t-rex/contracts/registry/IdentityRegistryStorage.sol";
import "@tokenysolutions/t-rex/contracts/compliance/modular/ModularCompliance.sol";

/// @title Deploy — Full ERC-3643 deployment in a single Foundry script
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Identity infrastructure
        ClaimTopicsRegistry claimTopicsRegistry = new ClaimTopicsRegistry();
        claimTopicsRegistry.addClaimTopic(1); // KYC
        claimTopicsRegistry.addClaimTopic(2); // AML

        TrustedIssuersRegistry trustedIssuersRegistry = new TrustedIssuersRegistry();
        IdentityRegistryStorage identityRegistryStorage = new IdentityRegistryStorage();

        IdentityRegistry identityRegistry = new IdentityRegistry(
            address(trustedIssuersRegistry),
            address(claimTopicsRegistry),
            address(identityRegistryStorage)
        );

        // 2. Compliance
        ModularCompliance compliance = new ModularCompliance();

        // 3. Token
        Token token = new Token(
            address(identityRegistry),
            address(compliance),
            "RWA Security Token",
            "RWASC",
            18,
            address(0)
        );

        compliance.bindToken(address(token));
        token.addAgent(msg.sender);

        vm.stopBroadcast();

        // Log addresses
        console2.log("ClaimTopicsRegistry:", address(claimTopicsRegistry));
        console2.log("TrustedIssuersRegistry:", address(trustedIssuersRegistry));
        console2.log("IdentityRegistry:", address(identityRegistry));
        console2.log("Compliance:", address(compliance));
        console2.log("Token:", address(token));
    }
}
