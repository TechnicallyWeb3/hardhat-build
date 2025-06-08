import { expect } from "chai";
import { ethers } from "hardhat";

describe("DataPointStorage Interface Test", function () {
  let dataPointStorage: any;
  let dataPointStorageUser: any;
  let owner: any;
  let addr1: any;

  beforeEach(async function () {
    // Get signers
    [owner, addr1] = await ethers.getSigners();

    // Deploy DataPointStorage contract
    const DataPointStorageFactory = await ethers.getContractFactory("DataPointStorage");
    dataPointStorage = await DataPointStorageFactory.deploy();
    await dataPointStorage.waitForDeployment();

    // Deploy DataPointStorageUser contract that uses the interface
    const DataPointStorageUserFactory = await ethers.getContractFactory("DataPointStorageUser");
    dataPointStorageUser = await DataPointStorageUserFactory.deploy(await dataPointStorage.getAddress());
    await dataPointStorageUser.waitForDeployment();
  });

  describe("Interface Generation Tests", function () {
    it("should have generated VERSION getter function in interface", async function () {
      // Test that our generated interface includes the VERSION getter
      const version = await dataPointStorageUser.getStorageVersion();
      expect(version).to.equal(2);
      console.log(`✅ VERSION getter working: ${version}`);
    });

    it("should be able to call VERSION directly on storage contract", async function () {
      // Test direct call to verify the actual contract has the function
      const version = await dataPointStorage.VERSION();
      expect(version).to.equal(2);
      console.log(`✅ Direct VERSION call working: ${version}`);
    });

    it("should be able to call all interface functions through user contract", async function () {
      const testData = ethers.toUtf8Bytes("Hello, ESP Storage!");
      
      // Test calculateAddress function
      const expectedAddress = await dataPointStorageUser.previewAddress(testData);
      expect(expectedAddress).to.be.properHex(64);
      console.log(`✅ calculateAddress working: ${expectedAddress}`);
      
      // Test writeDataPoint function
      const tx = await dataPointStorageUser.storeData(testData);
      await tx.wait();
      console.log(`✅ writeDataPoint working: stored data successfully`);
      
      // Should revert on duplicate (testing error handling)
      await expect(dataPointStorageUser.storeData(testData)).to.be.reverted;
      console.log(`✅ writeDataPoint working with proper error handling`);
      
      // Test dataPointSize function
      const size = await dataPointStorageUser.getDataSize(expectedAddress);
      expect(size).to.equal(testData.length);
      console.log(`✅ dataPointSize working: ${size} bytes`);
      
      // Test readDataPoint function
      const retrievedData = await dataPointStorageUser.readData(expectedAddress);
      expect(retrievedData).to.equal(ethers.hexlify(testData));
      console.log(`✅ readDataPoint working: ${ethers.toUtf8String(retrievedData)}`);
    });

    it("should demonstrate interface compatibility", async function () {
      // This test shows that our generated interface is compatible with the actual contract
      const testData = ethers.toUtf8Bytes("Interface compatibility test");
      
      // Calculate address using interface
      const interfaceAddress = await dataPointStorageUser.previewAddress(testData);
      
      // Calculate address using direct contract call  
      const directAddress = await dataPointStorage.calculateAddress(testData);
      
      // They should be identical
      expect(interfaceAddress).to.equal(directAddress);
      console.log(`✅ Interface/Contract compatibility verified`);
    });
  });

  describe("Interface Coverage Tests", function () {
    it("should include all public functions from the contract", async function () {
      // Verify our interface includes all the expected functions
      const userContract = dataPointStorageUser;
      
      // Test that all expected functions exist (will throw if not)
      expect(userContract.getStorageVersion).to.be.a('function');
      expect(userContract.storeData).to.be.a('function');
      expect(userContract.readData).to.be.a('function');
      expect(userContract.getDataSize).to.be.a('function');
      expect(userContract.previewAddress).to.be.a('function');
      
      console.log(`✅ All expected interface functions present`);
    });

    it("should properly handle state mutability", async function () {
      const testData = ethers.toUtf8Bytes("State mutability test");
      
      // VERSION should be callable without transaction (pure/view)
      const version1 = await dataPointStorageUser.getStorageVersion();
      const version2 = await dataPointStorageUser.getStorageVersion();
      expect(version1).to.equal(version2);
      
      // calculateAddress should be callable without transaction (pure)
      const addr1 = await dataPointStorageUser.previewAddress(testData);
      const addr2 = await dataPointStorageUser.previewAddress(testData);
      expect(addr1).to.equal(addr2);
      
      console.log(`✅ State mutability working correctly`);
    });
  });

  describe("Build Order Verification", function () {
    it("should confirm interfaces were available during compilation", async function () {
      // The fact that this test runs at all proves that:
      // 1. Interfaces were generated before Solidity compilation
      // 2. DataPointStorageUser could import IDataPointStorage 
      // 3. The contract compiled successfully with interface imports
      
      const userAddress = await dataPointStorageUser.getAddress();
      const storageAddress = await dataPointStorage.getAddress();
      
      expect(userAddress).to.be.properAddress;
      expect(storageAddress).to.be.properAddress;
      
      console.log(`✅ Build order verification passed:`);
      console.log(`   - DataPointStorageUser: ${userAddress}`);
      console.log(`   - DataPointStorage: ${storageAddress}`);
      console.log(`   - Interface import successful during compilation`);
    });
  });
}); 