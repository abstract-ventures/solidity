import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ERC721Soulbound", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployERC721SoulboundFixture() {
    const TOKEN_NAME = "Soulbound";
    const TOKEN_TICKER = "SLBD";

    // Contracts are deployed using the first signer/account by default
    const [owner, userOne, userTwo] = await ethers.getSigners();

    const ERC721Soulbound = await ethers.getContractFactory("ERC721Soulbound");
    const contract = await ERC721Soulbound.deploy(TOKEN_NAME, TOKEN_TICKER);

    return { contract, owner, userOne, userTwo };
  }

  describe("Deployment", () => {
    it("Should set the right owner", async () => {
      const { contract, owner } = await loadFixture(
        deployERC721SoulboundFixture
      );

      expect(await contract.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", () => {
    it("Should mint a token", async () => {
      const { contract, owner, userOne } = await loadFixture(
        deployERC721SoulboundFixture
      );
      const TOKEN_URI = "https://example.com/1.json";

      await contract.connect(owner).safeMint(userOne.address, TOKEN_URI);

      expect(await contract.balanceOf(userOne.address)).to.equal(1);
      expect(await contract.tokenURI(0)).to.equal(TOKEN_URI);
    });

    it("Should only allow owner to mint", async () => {
      const { contract, userOne } = await loadFixture(
        deployERC721SoulboundFixture
      );
      const TOKEN_URI = "https://example.com/1.json";

      await expect(
        contract.connect(userOne).safeMint(userOne.address, TOKEN_URI)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Burning", () => {
    it("Should allow any user to burn their own token", async () => {
      const { contract, owner, userOne } = await loadFixture(
        deployERC721SoulboundFixture
      );
      const TOKEN_URI = "https://example.com/1.json";

      await contract.connect(owner).safeMint(userOne.address, TOKEN_URI);
      await contract.connect(userOne).burn(0);

      expect(await contract.balanceOf(userOne.address)).to.equal(0);
    });

    it("Should not allow others to burn a user's token", async () => {
      const { contract, owner, userOne, userTwo } = await loadFixture(
        deployERC721SoulboundFixture
      );
      const TOKEN_URI = "https://example.com/1.json";

      await contract.connect(owner).safeMint(userOne.address, TOKEN_URI);
      await expect(contract.connect(userTwo).burn(0)).to.be.revertedWith(
        "ERC721: caller is not token owner or approved"
      );

      expect(await contract.balanceOf(userOne.address)).to.equal(1);
    });
  });

  describe("Transferring", () => {
    it("Should not allow users to transfer tokens with transferFrom", async () => {
      const { contract, owner, userOne, userTwo } = await loadFixture(
        deployERC721SoulboundFixture
      );
      const TOKEN_URI = "https://example.com/1.json";

      await contract.connect(owner).safeMint(userOne.address, TOKEN_URI);
      await expect(
        contract
          .connect(userOne)
          .transferFrom(userOne.address, userTwo.address, 0)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      expect(await contract.balanceOf(userOne.address)).to.equal(1);
    });

    it("Should not allow users to transfer tokens with safeTransferFrom", async () => {
      const { contract, owner, userOne, userTwo } = await loadFixture(
        deployERC721SoulboundFixture
      );
      const TOKEN_URI = "https://example.com/1.json";

      await contract.connect(owner).safeMint(userOne.address, TOKEN_URI);
      await expect(
        contract
          .connect(userOne)
          ["safeTransferFrom(address,address,uint256)"](
            userOne.address,
            userTwo.address,
            0
          )
      ).to.be.revertedWith("Ownable: caller is not the owner");

      expect(await contract.balanceOf(userOne.address)).to.equal(1);
    });

    it("Allows owner to transfer tokens in case of request from holder", async () => {
      const { contract, owner, userOne, userTwo } = await loadFixture(
        deployERC721SoulboundFixture
      );
      const TOKEN_URI = "https://example.com/1.json";

      await contract.connect(owner).safeMint(userOne.address, TOKEN_URI);
      await contract.connect(userOne).approve(owner.address, 0);
      await contract
        .connect(owner)
        .transferFrom(userOne.address, userTwo.address, 0);

      expect(await contract.balanceOf(userOne.address)).to.equal(0);
      expect(await contract.balanceOf(userTwo.address)).to.equal(1);
    });
  });
});
