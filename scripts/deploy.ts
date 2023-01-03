import { ethers } from "hardhat";

async function main() {
  const ERC721Soulbound = await ethers.getContractFactory("ERC721Soulbound");
  const contract = await ERC721Soulbound.deploy(
    "My Soulbound Token Name",
    "SLBD"
  );

  await contract.deployed();

  console.log(`ERC721Soulbound deployed to ${contract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
