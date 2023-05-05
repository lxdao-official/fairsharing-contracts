// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./FairSharing.sol";

// todo add DAO creation event
// todo make it upgradable
contract FairSharingFactory {
    FairSharing[] public fairSharings;

    function createFairSharing(
        string memory name,
        string memory symbol,
        address[] memory membersList,
        address owner
    ) external {
        FairSharing fairSharing = new FairSharing(
            name,
            symbol,
            membersList,
            owner
        );
        fairSharings.push(fairSharing);
    }

    function getCount() external view returns (uint256) {
        return fairSharings.length;
    }
}
