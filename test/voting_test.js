const Voting = artifacts.require("./Voting.sol");
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');


contract('Voting', accounts => {
  const owner = accounts[0];
  const second = accounts[1];
  const third = accounts[2];
  const fourth = accounts[3];
  const fifth = accounts[4];
  const sixth = accounts[5];


  let VotingInstance;

  describe("test vote workflow change function", () => {

    beforeEach(async function () {

      VotingInstance = await Voting.new({from:owner});

    });

    describe("test that current status doesn't permit to change the vote status", () => {

      it("should revert : Registering proposals hasnt started yet", async () => {
        await expectRevert(VotingInstance.endProposalsRegistering({ from: owner }), "Registering proposals havent started yet");
      });

      it("should revert : Registering proposals phase is not finished", async () => {
        await expectRevert(VotingInstance.startVotingSession({ from: owner }), "Registering proposals phase is not finished");
      });

      it("should revert : Voting session havent started yet", async () => {
        await expectRevert(VotingInstance.endVotingSession({ from: owner }), "Voting session havent started yet");
      });

    });

    describe("test that only owner can change vote status", () => {

      it("should revert : only owner can start proposals registering", async () => {
        await expectRevert(VotingInstance.startProposalsRegistering({ from: third }), "Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner");
      });

      it("should revert : only owner can end proposals registering", async () => {
        await expectRevert(VotingInstance.endProposalsRegistering({ from: third }), "Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner");
      });

      it("should revert : only owner can start voting session", async () => {
        await expectRevert(VotingInstance.startVotingSession({ from: third }), "Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner");
      });

      it("should revert : only owner can end voting session", async () => {
        await expectRevert(VotingInstance.endVotingSession({ from: third }), "Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner");
      });

    });

    describe("test that owner can change status", () => {

      it("should change vote status to ProposalsRegistrationStarted", async () => {
        await VotingInstance.startProposalsRegistering({ from: owner });
        const newStatus = await VotingInstance.workflowStatus.call();
        expect(newStatus).to.be.bignumber.equal(new BN(1));
      });

      it("should change vote status to ProposalsRegistrationEnded", async () => {
        await VotingInstance.startProposalsRegistering({ from: owner });
        await VotingInstance.endProposalsRegistering({ from: owner });
        const newStatus = await VotingInstance.workflowStatus.call();
        expect(newStatus).to.be.bignumber.equal(new BN(2));
      });

      it("should change vote status to VotingSessionStarted", async () => {
        await VotingInstance.startProposalsRegistering({ from: owner });
        await VotingInstance.endProposalsRegistering({ from: owner });
        await VotingInstance.startVotingSession({ from: owner });
        const newStatus = await VotingInstance.workflowStatus.call();
        expect(newStatus).to.be.bignumber.equal(new BN(3));
      });

      it("should change vote status to VotingSessionEnded", async () => {
        await VotingInstance.startProposalsRegistering({ from: owner });
        await VotingInstance.endProposalsRegistering({ from: owner });
        await VotingInstance.startVotingSession({ from: owner });
        await VotingInstance.endVotingSession({ from: owner });
        const newStatus = await VotingInstance.workflowStatus.call();
        expect(newStatus).to.be.bignumber.equal(new BN(4));
      });

    });
    
    describe("test that right event is emmited when status change", () => {

      it("should emit event: WorkflowStatusChange", async () => {
        const findEvent = await VotingInstance.startProposalsRegistering({ from: owner });
        expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(0), newStatus: new BN(1)});
      });

      it("should emit event: WorkflowStatusChange", async () => {
        await VotingInstance.startProposalsRegistering({ from: owner });
        const findEvent = await VotingInstance.endProposalsRegistering({ from: owner });
        expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(1), newStatus: new BN(2)});
      });

      it("should emit event: WorkflowStatusChange", async () => {
        await VotingInstance.startProposalsRegistering({ from: owner });
        await VotingInstance.endProposalsRegistering({ from: owner });
        const findEvent = await VotingInstance.startVotingSession({ from: owner });
        expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(2), newStatus: new BN(3)});
      });

      it("should emit event: WorkflowStatusChange", async () => {
        await VotingInstance.startProposalsRegistering({ from: owner });
        await VotingInstance.endProposalsRegistering({ from: owner });
        await VotingInstance.startVotingSession({ from: owner });
        const findEvent = await VotingInstance.endVotingSession({ from: owner });
        expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(3), newStatus: new BN(4)});
      });

    });

  });
  describe("test resgitration : registering, getVotter, event, modifier", function () {

    beforeEach(async function () {
        VotingInstance = await Voting.new({from:owner});
    });

    it("should revert : voter registration should be open", async () => {
      await expectRevert(VotingInstance.addVoter(second, { from: third }), "Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner");
    });

    it("should revert : only owner can register voters", async () => {
      await expectRevert(VotingInstance.addVoter(second, { from: third }), "Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner");
    });
  
    it("should set True to the mapping for the voter's address, return True for the same address (called by voter)", async () => {
      await VotingInstance.addVoter(second, { from: owner });
      const storedData = await VotingInstance.getVoter(second, { from: second });
      expect(storedData.isRegistered).to.be.true;
    });

    it("should register a voter and emit event : VoterRegistered", async () => {
      const findEvent = await VotingInstance.addVoter(second, { from: owner });
      expectEvent(findEvent, "VoterRegistered", {voterAddress: second});
    });

    it("should revert : only voters can check all voters", async () => {
      await VotingInstance.addVoter(second, { from: owner });
      await expectRevert(VotingInstance.getVoter(second, { from: third }), "You're not a voter");
      await expectRevert(VotingInstance.getVoter(second, { from: owner }), "You're not a voter");
    });
     
  });

  describe("test proposal : addProposal, getOneProposal, event, modifier", function () {

    beforeEach(async function () {
        VotingInstance = await Voting.new({from:owner});
        await VotingInstance.addVoter(second, { from: owner });
    });

    it("should revert : Proposals are not allowed yet", async () => {
      await expectRevert(VotingInstance.addProposal("Alice", { from: second }), "Proposals are not allowed yet");
    });

    it("should revert : only voters can add proposal", async () => {
      await VotingInstance.startProposalsRegistering({ from: owner });
      await expectRevert(VotingInstance.addProposal("Alice", { from: third }), "You're not a voter");
    });

    it("should revert : can't add an empty proposal", async () => {
      await VotingInstance.startProposalsRegistering({ from: owner });
      await expectRevert(VotingInstance.addProposal("", { from: second }), "Vous ne pouvez pas ne rien proposer");
    });

    it("should add a new proposal, get description", async () => {
      await VotingInstance.startProposalsRegistering({ from: owner });
      await VotingInstance.addProposal("Alice", { from: second });
      const storedData = await VotingInstance.getOneProposal(0, { from: second });
      expect(storedData.description).to.be.equal("Alice");
    });

    it("should add a new proposal, get initial vote count", async () => {
      await VotingInstance.startProposalsRegistering({ from: owner });
      await VotingInstance.addProposal("Alice", { from: second });
      const storedData = await VotingInstance.getOneProposal(0, { from: second });
      expect(new BN(storedData.voteCount)).to.be.bignumber.equal(new BN(0));
    });

    it("should add 2 proposals, get one description", async () => {
      await VotingInstance.addVoter(third, { from: owner });
      await VotingInstance.startProposalsRegistering({ from: owner });
      await VotingInstance.addProposal("Alice", { from: second });
      await VotingInstance.addProposal("Bob", { from: third });
      const storedData = await VotingInstance.getOneProposal(1, { from: second });
      expect(storedData.description).to.be.equal("Bob");
    });

    it("should add a new proposal, get initial vote count", async () => {
      await VotingInstance.startProposalsRegistering({ from: owner });
      await VotingInstance.addProposal("Alice", { from: second });
      const storedData = await VotingInstance.getOneProposal(0, { from: second });
      expect(new BN(storedData.voteCount)).to.be.bignumber.equal(new BN(0));
    });

    it("should add a new proposal, and emit event : ProposalRegistered", async () => {
      await VotingInstance.startProposalsRegistering({ from: owner });
      const findEvent =  await VotingInstance.addProposal("Alice", { from: second });
      expectEvent(findEvent, "ProposalRegistered", {proposalId: new BN(0)});
    });  
  });

  describe("test vote functions and event", function () {

    beforeEach(async function () {

        VotingInstance = await Voting.new({from:owner});
        await VotingInstance.addVoter(second, { from: owner });
        await VotingInstance.addVoter(fourth, { from: owner });
        await VotingInstance.startProposalsRegistering({ from: owner });
        await VotingInstance.addProposal("Alice", { from: second });
        await VotingInstance.addProposal("Bob", { from: fourth });
        await VotingInstance.endProposalsRegistering({ from: owner });

    });

    it("should revert : Voting session havent started yet", async () => {
      await expectRevert(VotingInstance.setVote(0, { from: second }), "Voting session havent started yet");
    });

    it("should revert : Only voters modifier", async () => {
      await expectRevert(VotingInstance.setVote(0, { from: third }), "You're not a voter");
    });

    it("should revert : can't vote a second time", async () => {
      await VotingInstance.startVotingSession({ from: owner });
      await VotingInstance.setVote(0, { from: second });
      await expectRevert(VotingInstance.setVote(0, { from: second }), "You have already voted");      
    });

    it("should revert : proposal not found", async () => {
      await VotingInstance.startVotingSession({ from: owner });
      await expectRevert(VotingInstance.setVote(2, { from: second }), "Proposal not found");      
    });

    it("should add 1 to voteCount for a proposal", async () => {
      await VotingInstance.startVotingSession({ from: owner });
      await VotingInstance.setVote(0, { from: second });
      const storedData = await VotingInstance.getOneProposal(0, { from: second });
      expect(new BN(storedData.voteCount)).to.be.bignumber.equal(new BN(1));
    });

    it("should add 2 to voteCount for a proposal", async () => {
      await VotingInstance.startVotingSession({ from: owner });
      await VotingInstance.setVote(0, { from: second });
      await VotingInstance.setVote(0, { from: fourth });
      const storedData = await VotingInstance.getOneProposal(0, { from: second });
      expect(new BN(storedData.voteCount)).to.be.bignumber.equal(new BN(2));
    });

    it("should not store voted proposal ID to another voter", async () => {
      await VotingInstance.startVotingSession({ from: owner });
      await VotingInstance.setVote(0, { from: second });
      const storedData = await VotingInstance.getVoter(fourth, { from: fourth });
      expect(new BN(storedData.votedProposalId)).to.be.bignumber.equal(new BN(0));
    });

    it("should store voted proposal ID to voter's mapping", async () => {
      await VotingInstance.startVotingSession({ from: owner });
      await VotingInstance.setVote(1, { from: second });
      const storedData = await VotingInstance.getVoter(fourth, { from: fourth });
      expect(new BN(storedData.votedProposalId)).to.be.bignumber.equal(new BN(0));
    });

    it("should not store true for another voter", async () => {
      await VotingInstance.startVotingSession({ from: owner });
      await VotingInstance.setVote(1, { from: second });
      const storedData = await VotingInstance.getVoter(fourth, { from: fourth });
      expect(storedData.hasVoted).to.be.false;
    });

    it("should store true for hasVoted to voter's mapping", async () => {
      await VotingInstance.startVotingSession({ from: owner });
      await VotingInstance.setVote(0, { from: second });
      const storedData = await VotingInstance.getVoter(fourth, { from: fourth });
      expect(storedData.hasVoted).to.be.false;
    });

    it("should set a vote, and emit event : Voted", async () => {
      await VotingInstance.startVotingSession({ from: owner });
      const findEvent = await VotingInstance.setVote(0, { from: second });
      expectEvent(findEvent, "Voted", {voter: second, proposalId: new BN(0)});
    }); 

  });

  describe("test function tallyVotes", () => {
    beforeEach(async function () {

      VotingInstance = await Voting.new({from:owner});
      await VotingInstance.addVoter(second, { from: owner });
      await VotingInstance.addVoter(third, { from: owner });
      await VotingInstance.addVoter(fourth, { from: owner });
      await VotingInstance.addVoter(fifth, { from: owner });
      await VotingInstance.startProposalsRegistering({ from: owner });
      await VotingInstance.addProposal("Alice", { from: second });
      await VotingInstance.addProposal("Bob", { from: third });
      await VotingInstance.addProposal("John", { from: fourth });
      await VotingInstance.endProposalsRegistering({ from: owner });
      await VotingInstance.startVotingSession({ from: owner });
      await VotingInstance.setVote(0, { from: second });
      await VotingInstance.setVote(1, { from: third });

  });

  it("should revert : Current status is not voting session ended", async () => {
    await expectRevert(VotingInstance.tallyVotes({ from: owner }), "Current status is not voting session ended");
  });

  it("should revert : onlyOwner can draw the winner proposal", async () => {
    await VotingInstance.endVotingSession({ from: owner });
    await expectRevert(VotingInstance.tallyVotes({ from: second }), "Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner");
  });

  it("should set the winning proposal ID to 1", async () => {
    await VotingInstance.setVote(1, { from: fourth });
    await VotingInstance.endVotingSession({ from: owner });
    await VotingInstance.tallyVotes({ from: owner });
    const storedData = await VotingInstance.winningProposalID.call();
    expect(storedData).to.be.bignumber.equal(new BN(1));
  });

  it("should set the winning proposal ID to 2", async () => {
    await VotingInstance.setVote(2, { from: fourth });
    await VotingInstance.setVote(2, { from: fifth });
    await VotingInstance.endVotingSession({ from: owner });
    await VotingInstance.tallyVotes({ from: owner });
    const storedData = await VotingInstance.winningProposalID.call();
    expect(storedData).to.be.bignumber.equal(new BN(2))
  });;

  it("should set the winning proposal ID to 2, not equal to 1", async () => {
    await VotingInstance.setVote(2, { from: fourth });
    await VotingInstance.setVote(2, { from: fifth });
    await VotingInstance.endVotingSession({ from: owner });
    await VotingInstance.tallyVotes({ from: owner });
    const storedData = await VotingInstance.winningProposalID.call();
    expect(storedData).to.not.be.bignumber.equal(new BN(1));
  });

  it("should change current vote status to VotingSessionEnded", async () => {
    await VotingInstance.setVote(1, { from: fourth });
    await VotingInstance.endVotingSession({ from: owner });
    await VotingInstance.tallyVotes({ from: owner });
    const storedData = await VotingInstance.workflowStatus.call();
    expect(storedData).to.be.bignumber.equal(new BN(5));
  });

  it("should emit event : WorkflowStatusChange", async () => {
    await VotingInstance.setVote(1, { from: fourth });
    await VotingInstance.endVotingSession({ from: owner });
    const findEvent = await VotingInstance.tallyVotes({ from: owner });
    expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(4), newStatus: new BN(5)});
  });

  });

});

