import * as StellarXdr from "./StellarXdr";
import { prettifyJsonString } from "./prettifyJsonString";
import {
  CONTRACT_SECTIONS,
  ContractData,
  ContractSectionName,
} from "../types/types";

export type WasmContractData = Record<ContractSectionName, ContractData>;

export type WasmContractDataResult =
  | { ok: true; data: WasmContractData }
  | { ok: false; error: string };

const TYPE_VARIANT: Record<ContractSectionName, string> = {
  contractenvmetav0: "ScEnvMetaEntry",
  contractmetav0: "ScMetaEntry",
  contractspecv0: "ScSpecEntry",
};

const getJsonAndXdr = (
  sectionName: ContractSectionName,
  xdr: string,
): { json: string[]; xdr: string[]; error?: string } => {
  try {
    const jsonStringArray = StellarXdr.decode_stream(
      TYPE_VARIANT[sectionName],
      xdr,
    );

    return {
      json: jsonStringArray.map((s: string) => prettifyJsonString(s)),
      xdr: jsonStringArray.map((s: string) =>
        StellarXdr.encode(TYPE_VARIANT[sectionName], s),
      ),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      json: [],
      xdr: [],
      error: `Failed to decode XDR for section ${sectionName}: ${message}`,
    };
  }
};

const sectionResult = (
  sectionName: ContractSectionName,
  section: ArrayBuffer,
): { sectionData: ContractData; error?: string } => {
  const sectionDataBytes = new Uint8Array(section);
  const sectionXdr = Buffer.from(sectionDataBytes).toString("base64");
  const { json, xdr, error } = getJsonAndXdr(sectionName, sectionXdr);

  return {
    sectionData: {
      xdr,
      json,
    },
    error,
  };
};

export const getWasmContractData = async (
  wasmBytes: Buffer,
): Promise<WasmContractDataResult> => {
  let mod: WebAssembly.Module;
  try {
    mod = await WebAssembly.compile(new Uint8Array(wasmBytes));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: `Failed to compile WebAssembly binary: ${message}`,
    };
  }

  const result: WasmContractData = {
    contractmetav0: {},
    contractenvmetav0: {},
    contractspecv0: {},
  };

  try {
    // Make sure the StellarXdr is available
    await StellarXdr.initialize();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: `Failed to initialize Stellar XDR decoder: ${message}`,
    };
  }

  for (const sectionName of CONTRACT_SECTIONS) {
    const sections = WebAssembly.Module.customSections(mod, sectionName);

    if (sections.length > 0) {
      for (let i = 0; i < sections.length; i++) {
        const { sectionData, error } = sectionResult(sectionName, sections[i]);
        if (error) {
          return { ok: false, error };
        }
        result[sectionName] = sectionData;
      }
    }
  }

  return { ok: true, data: result };
};
