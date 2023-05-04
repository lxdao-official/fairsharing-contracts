// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./FairSharing.sol";

contract FairSharingFactory {
    FairSharing[] public fairSharings;

    function createFairSharing(
        string memory name,
        string memory symbol,
        address[] memory membersList,
        address owner
    ) external {
        FairSharing fairSharing = new FairSharing(name, symbol, membersList, owner);
        fairSharings.push(fairSharing);
    }
}
