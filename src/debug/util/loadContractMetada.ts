import { Server } from "@stellar/stellar-sdk/rpc";
import { network } from "../../contracts/util";
import { Contract } from "@stellar/stellar-sdk";
import { getWasmContractData } from "./getWasmContractData";

export interface ContractMetadata {
  contractmetav0?: { [key: string]: string };
  contractenvmetav0?: { [key: string]: string };
  wasmHash?: string;
  wasmBinary?: string;
  error?: string;
}

export const loadContractMetadata = async (contractId: string) => {
  try {
    const wasmHash = await loadWasmHash(contractId);
    if (!wasmHash) {
      throw new Error(`Failed to load WASM hash for contract ${contractId}`);
    }
    const wasm = await loadWasmBinary(wasmHash);
    if (!wasm) {
      throw new Error(`Failed to load WASM binary for hash ${wasmHash}`);
    }

    const wasmDataResult = await getWasmContractData(wasm);
    if (!wasmDataResult.ok) {
      console.error(
        `Failed to decode WASM contract data for ${contractId}:`,
        wasmDataResult.error,
      );
      return {
        wasmHash,
        wasmBinary: wasm.toString("hex"),
        error: wasmDataResult.error,
      } as ContractMetadata;
    }

    const wasmData = wasmDataResult.data;

    let contractmetav0: Record<string, string> | undefined;
    if (wasmData.contractmetav0?.json?.length) {
      const sectionContent: Record<string, string> = {};
      wasmData.contractmetav0.json.forEach((jsonStr) => {
        try {
          const parsed = JSON.parse(jsonStr) as Record<
            string,
            { key?: string; val?: string } | Record<string, string>
          >;
          Object.keys(parsed).forEach((key) => {
            const entry = parsed[key];
            if (
              entry &&
              typeof entry === "object" &&
              "key" in entry &&
              "val" in entry
            ) {
              if (entry.key && entry.val !== undefined) {
                sectionContent[entry.key] = String(entry.val);
              }
            } else if (entry && typeof entry === "object") {
              Object.keys(entry).forEach((innerKey) => {
                sectionContent[innerKey] = String(
                  (entry as Record<string, string>)[innerKey],
                );
              });
            }
          });
        } catch {
          // ignore malformed inner json
        }
      });
      contractmetav0 = sectionContent;
    }

    let contractenvmetav0: Record<string, string> | undefined;
    if (wasmData.contractenvmetav0?.json?.length) {
      const sectionContent: Record<string, string> = {};
      wasmData.contractenvmetav0.json.forEach((jsonStr) => {
        try {
          const parsed = JSON.parse(jsonStr) as Record<
            string,
            { key?: string; val?: string } | Record<string, string>
          >;
          Object.keys(parsed).forEach((key) => {
            const entry = parsed[key];
            if (
              entry &&
              typeof entry === "object" &&
              "key" in entry &&
              "val" in entry
            ) {
              if (entry.key && entry.val !== undefined) {
                sectionContent[entry.key] = String(entry.val);
              }
            } else if (entry && typeof entry === "object") {
              Object.keys(entry).forEach((innerKey) => {
                sectionContent[innerKey] = String(
                  (entry as Record<string, string>)[innerKey],
                );
              });
            }
          });
        } catch {
          // ignore malformed inner json
        }
      });
      contractenvmetav0 = sectionContent;
    }

    const metadata: ContractMetadata = {
      contractmetav0,
      contractenvmetav0,
      wasmHash,
      wasmBinary: wasm.toString("hex"),
    };

    return metadata;
  } catch (error) {
    console.error(`Failed to load contract metadata for ${contractId}:`, error);
    return {};
  }
};

const loadWasmHash = async (contractId: string) => {
  try {
    const server = new Server(network.rpcUrl, { allowHttp: true });

    const contractLedgerKey = new Contract(contractId).getFootprint();
    const response = await server.getLedgerEntries(contractLedgerKey);
    if (!response.entries.length || !response.entries[0]?.val) {
      throw new Error(`No entries found for contract ${contractId}`);
    }
    const wasmHash = response.entries[0].val
      .contractData()
      .val()
      .instance()
      .executable()
      .wasmHash()
      .toString("hex");

    return wasmHash;
  } catch (error) {
    console.error(`Failed to load contract metadata for ${contractId}:`, error);
    return null;
  }
};

const loadWasmBinary = async (wasmHash: string) => {
  try {
    const server = new Server(network.rpcUrl, { allowHttp: true });

    return await server.getContractWasmByHash(wasmHash, "hex");
  } catch (error) {
    console.error(`Failed to load contract metadata for ${wasmHash}:`, error);
    return null;
  }
};
