// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@aragon/osx/core/dao/DAO.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract FairSharing is ERC20, Ownable, DAO {
    using ECDSA for bytes32;

    // Mapping to store the membership status of an address. true: active, false: inactive
    mapping(address => bool) public members;
    // Array to store the list of member addresses. Contain both active and inactive members
    address[] public membersList;
    uint public totalMembers;
    address public contractAddr;
    // Mapping from contributionId => claimed status
    mapping(bytes32 => bool) public claimed;

    struct Vote {
        address voter;
        bool approve;
        bytes signature;
    }

    constructor(
        string memory name,
        string memory symbol,
        address[] memory _membersList,
        address owner
    ) ERC20(name, symbol) {
        // TODO DAO.initialize(xxx)
        membersList = _membersList;
        for (uint i = 0; i < _membersList.length; i++) {
            members[_membersList[i]] = true;
            totalMembers++;
        }
        _transferOwnership(owner);
        contractAddr = address(this);
    }

    function addMember(address member) external onlyOwner {
        members[member] = true;
        membersList.push(member);
        totalMembers++;
    }

    function removeMember(address member) external onlyOwner {
        members[member] = false;
        totalMembers--;
    }

    function claim(
        bytes32 contributionId,
        uint points,
        Vote[] calldata votes
    ) external {
        require(!claimed[contributionId], "Already claimed");
        require(members[msg.sender], "Only member can claim");
        uint approvedVotes;
        // TODO: remove duplicated vote?
        for (uint i = 0; i < votes.length; i++) {
            bytes memory data = abi.encodePacked(
                msg.sender,
                contributionId,
                votes[i].voter,
                votes[i].approve,
                points
            );
            address dataSigner = keccak256(data)
                .toEthSignedMessageHash()
                .recover(votes[i].signature);
            require(dataSigner == votes[i].voter, "Wrong signature");
            if (votes[i].approve) {
                approvedVotes++;
            }
        }
        require(approvedVotes >= totalMembers / 2, "Not enough voters");

        _mint(msg.sender, points);
        claimed[contributionId] = true;
    }

    function sharing() external payable {
        uint totalToken;
        for (uint i = 0; i < membersList.length; i++) {
            if (members[membersList[i]]) {
                totalToken += balanceOf(membersList[i]);
            }
        }

        for (uint i = 0; i < membersList.length; i++) {
            if (members[membersList[i]]) {
                (bool success, ) = membersList[i].call{
                    value: (msg.value * balanceOf(membersList[i])) / totalToken
                }("");
                require(success, "Transfer failed");
            }
        }
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
}
