import { time, loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from "chai";
import hre from "hardhat";
import { smock, FakeContract } from '@defi-wonderland/smock'
import { IWithdrawalVerifier, Lock__factory } from "../typechain-types";

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const lock = (await new Lock__factory(owner).deploy(unlockTime, { value: lockedAmount }));

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.unlockTime()).to.equal(unlockTime);
    });

    it("Should set the right owner", async function () {
      const { lock, owner } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.owner()).to.equal(owner.address);
    });
  });

  describe("Withdrawals", function () {
    let mockedVerifier: FakeContract<IWithdrawalVerifier>

    beforeEach(async () => {
      mockedVerifier = await smock.fake<IWithdrawalVerifier>('IWithdrawalVerifier')
    })

    describe("Validations", function () {
      it("Should withdraw with mocked verifier", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);

        await expect(lock.withdraw(mockedVerifier.address)).to.not.be.reverted;
      });
    });

  });
});
