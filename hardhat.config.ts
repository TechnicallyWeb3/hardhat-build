import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "./src"; // Use local plugin for testing

const config: HardhatUserConfig = {
  solidity: "0.8.28",
};

export default config;
