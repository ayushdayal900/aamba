const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KycSoulbound", function () {
    let KycSoulbound, kycSoulbound;
    let admin, user1, user2;

    beforeEach(async function () {
        [admin, user1, user2] = await ethers.getSigners();

        KycSoulbound = await ethers.getContractFactory("KycSoulbound");
        kycSoulbound = await KycSoulbound.deploy(admin.address);
        await kycSoulbound.waitForDeployment();
    });

    describe("Minting", function () {
        const testUri = "ipfs://QmTestHash12345/metadata.json";

        it("Should allow admin to mint a KYC NFT", async function () {
            await expect(kycSoulbound.connect(admin).issueKyc(user1.address, testUri))
                .to.emit(kycSoulbound, "KycVerified")
                .withArgs(user1.address, 0, testUri);

            expect(await kycSoulbound.ownerOf(0)).to.equal(user1.address);
            expect(await kycSoulbound.hasKyc(user1.address)).to.be.true;
            expect(await kycSoulbound.tokenURI(0)).to.equal(testUri);
        });

        it("Should prevent non-admins from minting", async function () {
            await expect(
                kycSoulbound.connect(user1).issueKyc(user2.address, testUri)
            ).to.be.revertedWithCustomError(kycSoulbound, "OwnableUnauthorizedAccount");
        });

        it("Should prevent a user from holding more than one KYC NFT", async function () {
            await kycSoulbound.connect(admin).issueKyc(user1.address, testUri);

            await expect(
                kycSoulbound.connect(admin).issueKyc(user1.address, testUri)
            ).to.be.revertedWith("Address already has a KYC NFT");
        });
    });

    describe("Transfers (Soulbound functionality)", function () {
        const testUri = "ipfs://QmTestHash12345/metadata.json";

        beforeEach(async function () {
            await kycSoulbound.connect(admin).issueKyc(user1.address, testUri);
        });

        it("Should revert when trying to transfer the NFT", async function () {
            // Try safeTransferFrom
            await expect(
                kycSoulbound.connect(user1)["safeTransferFrom(address,address,uint256)"](user1.address, user2.address, 0)
            ).to.be.revertedWith("KycSoulbound: Tokens are non-transferable");

            // Try transferFrom
            await expect(
                kycSoulbound.connect(user1).transferFrom(user1.address, user2.address, 0)
            ).to.be.revertedWith("KycSoulbound: Tokens are non-transferable");
        });
    });

    describe("Revoking", function () {
        const testUri = "ipfs://QmTestHash12345/metadata.json";

        beforeEach(async function () {
            await kycSoulbound.connect(admin).issueKyc(user1.address, testUri);
        });

        it("Should allow admin to revoke a KYC NFT", async function () {
            await expect(kycSoulbound.connect(admin).revokeKyc(user1.address, 0))
                .to.emit(kycSoulbound, "KycRevoked")
                .withArgs(user1.address, 0);

            expect(await kycSoulbound.hasKyc(user1.address)).to.be.false;
            await expect(kycSoulbound.ownerOf(0)).to.be.revertedWithCustomError(kycSoulbound, "ERC721NonexistentToken");
        });

        it("Should not allow non-admin to revoke", async function () {
            await expect(
                kycSoulbound.connect(user1).revokeKyc(user1.address, 0)
            ).to.be.revertedWithCustomError(kycSoulbound, "OwnableUnauthorizedAccount");
        });
    });
});
