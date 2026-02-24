// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract KycSoulbound is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Mapping to enforce one KYC NFT per wallet
    mapping(address => bool) public hasKyc;

    event KycVerified(address indexed user, uint256 indexed tokenId, string tokenUri);
    event KycRevoked(address indexed user, uint256 indexed tokenId);

    constructor(address initialOwner) 
        ERC721("MicroFin KYC Soulbound", "MKYC") 
        Ownable(initialOwner) 
    {}

    /**
     * @dev Mints a soulbound KYC NFT to a specified address.
     * Only the owner (Backend Admin) can mint.
     * Requires the user to not already have a KYC NFT.
     */
    function issueKyc(address to, string memory uri) external onlyOwner {
        require(to != address(0), "Cannot issue to zero address");
        require(!hasKyc[to], "Address already has a KYC NFT");

        uint256 tokenId = _nextTokenId++;
        hasKyc[to] = true;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit KycVerified(to, tokenId, uri);
    }

    /**
     * @dev Revokes a soulbound KYC NFT from a specified address.
     * Only the owner (Backend Admin) can revoke.
     */
    function revokeKyc(address from, uint256 tokenId) external onlyOwner {
        require(ownerOf(tokenId) == from, "Address does not own this token");
        
        hasKyc[from] = false;
        _burn(tokenId);

        emit KycRevoked(from, tokenId);
    }

    /**
     * @dev Overrides the standard transfer function to prevent transfers.
     * This makes the NFT "Soulbound".
     */
    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721) {
        revert("KycSoulbound: Tokens are non-transferable");
    }

    // Required overrides by Solidity
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Prevent all transfers except minting (from == 0) and burning (to == 0)
        if (from != address(0) && to != address(0)) {
            revert("KycSoulbound: Tokens are non-transferable");
        }

        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
