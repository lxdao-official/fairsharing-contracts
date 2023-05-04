// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./FairSharing.sol";

contract Factory {
    address[] public fairSharings;

    function createFairSharing(
        string memory name,
        string memory symbol,
        address[] memory membersList
    ) external {
        FairSharing fairSharing = new FairSharing(name, symbol, membersList);
        fairSharings.push(address(fairSharing));
    }
}
