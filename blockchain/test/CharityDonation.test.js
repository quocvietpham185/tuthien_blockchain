const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CharityDonation", function () {
  let charity;
  let owner, user1, user2, user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    const CharityDonation = await ethers.getContractFactory("CharityDonation");
    charity = await CharityDonation.deploy();
    await charity.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right platform owner", async function () {
      expect(await charity.platformOwner()).to.equal(owner.address);
    });

    it("Should start with 0 campaigns", async function () {
      expect(await charity.campaignCount()).to.equal(0);
    });
  });

  describe("createCampaign", function () {
    it("Should create a campaign successfully", async function () {
      const goal = ethers.parseEther("1");
      const tx = await charity.createCampaign(
        "Test Campaign",
        "Test Description",
        "Education",
        "QmTest123",
        goal,
        30
      );
      await tx.wait();

      expect(await charity.campaignCount()).to.equal(1);
      const campaign = await charity.getCampaign(1);
      expect(campaign.title).to.equal("Test Campaign");
      expect(campaign.goal).to.equal(goal);
      expect(campaign.active).to.be.true;
    });

    it("Should emit CampaignCreated event", async function () {
      const goal = ethers.parseEther("1");
      await expect(
        charity.createCampaign("Test", "Desc", "Category", "QmHash", goal, 30)
      ).to.emit(charity, "CampaignCreated");
    });

    it("Should reject empty title", async function () {
      await expect(
        charity.createCampaign("", "Desc", "Cat", "QmHash", ethers.parseEther("1"), 30)
      ).to.be.revertedWith("Title is required");
    });

    it("Should reject 0 goal", async function () {
      await expect(
        charity.createCampaign("Title", "Desc", "Cat", "QmHash", 0, 30)
      ).to.be.revertedWith("Goal must be greater than 0");
    });
  });

  describe("donate", function () {
    beforeEach(async function () {
      await charity.createCampaign(
        "Help Campaign",
        "Description",
        "Medical",
        "QmMedical",
        ethers.parseEther("5"),
        30
      );
    });

    it("Should accept donation", async function () {
      const amount = ethers.parseEther("0.5");
      await charity.connect(user1).donate(1, "Great cause!", { value: amount });
      const campaign = await charity.getCampaign(1);
      expect(campaign.raised).to.equal(amount);
    });

    it("Should emit DonationReceived event", async function () {
      await expect(
        charity.connect(user1).donate(1, "Hello", { value: ethers.parseEther("0.1") })
      ).to.emit(charity, "DonationReceived");
    });

    it("Should reject 0 donation", async function () {
      await expect(
        charity.connect(user1).donate(1, "msg", { value: 0 })
      ).to.be.revertedWith("Donation must be greater than 0");
    });

    it("Should track donor count", async function () {
      await charity.connect(user1).donate(1, "", { value: ethers.parseEther("0.1") });
      await charity.connect(user2).donate(1, "", { value: ethers.parseEther("0.2") });
      const campaign = await charity.getCampaign(1);
      expect(campaign.donorCount).to.equal(2);
    });
  });

  describe("withdrawFunds", function () {
    beforeEach(async function () {
      await charity.createCampaign(
        "Campaign",
        "Desc",
        "Education",
        "QmHash",
        ethers.parseEther("5"),
        30
      );
      await charity.connect(user1).donate(1, "donation", { value: ethers.parseEther("1") });
    });

    it("Should allow owner to withdraw", async function () {
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      await charity.withdrawFunds(1);
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should reject non-owner withdrawal", async function () {
      await expect(charity.connect(user1).withdrawFunds(1)).to.be.revertedWith(
        "Not campaign owner"
      );
    });

    it("Should reject double withdrawal", async function () {
      await charity.withdrawFunds(1);
      await expect(charity.withdrawFunds(1)).to.be.revertedWith("Funds already withdrawn");
    });

    it("Should emit FundsWithdrawn event", async function () {
      await expect(charity.withdrawFunds(1)).to.emit(charity, "FundsWithdrawn");
    });
  });

  describe("getPlatformStats", function () {
    it("Should return correct stats", async function () {
      await charity.createCampaign(
        "C1", "D1", "Cat", "Qm1", ethers.parseEther("1"), 30
      );
      await charity.createCampaign(
        "C2", "D2", "Cat", "Qm2", ethers.parseEther("2"), 30
      );
      await charity.connect(user1).donate(1, "", { value: ethers.parseEther("0.5") });

      const [total, donations, active] = await charity.getPlatformStats();
      expect(total).to.equal(2);
      expect(donations).to.equal(ethers.parseEther("0.5"));
      expect(active).to.equal(2);
    });
  });
});
