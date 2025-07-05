// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SelfVerificationRoot} from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import {IIdentityVerificationHubV2} from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";
import {SelfStructs} from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";
import {AttestationId} from "@selfxyz/contracts/contracts/constants/AttestationId.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SelfVerify is SelfVerificationRoot, Ownable {
    // Your app-specific configuration ID
    // Age 18 +
    bytes32 public configId =
        0xc52f992ebee4435b00b65d2c74b12435e96359d1ccf408041528414e6ea687bc;

    address public VerificationHubMainAddress =
        0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF;

    event UserVerified(address indexed user, string nationality);
    error RegisteredNullifier();

    // Mapping to store nullifier to user identifier to prevent multiple documents registrating twice
    mapping(uint256 nullifier => uint256 userIdentifier)
        internal _nullifierToUserIdentifier;

    constructor()
        SelfVerificationRoot(VerificationHubMainAddress, 0)
        Ownable(msg.sender)
    {}

    // Required: Override to provide configId for verification
    function getConfigId(
        bytes32 destinationChainId,
        bytes32 userIdentifier,
        bytes memory userDefinedData // Custom data from the qr code configuration
    ) public view override returns (bytes32) {
        // Return your app's configuration ID
        return configId;
    }

    // Override to handle successful verification
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory userData
    ) internal virtual override {
        require(bytes(output.nationality).length > 0, "Nationality required");

        address verifiedAddress = address(uint160(output.userIdentifier));

        if (_nullifierToUserIdentifier[output.nullifier] != 0)
            revert RegisteredNullifier();

        _nullifierToUserIdentifier[output.nullifier] = output.userIdentifier;

        emit UserVerified(verifiedAddress, string(output.nationality));
    }

    function setScope(uint256 _scope) external onlyOwner {
        // Update the scope in the parent contract
        _setScope(_scope);
    }
}
