import * as React from "react";
import { Server, Api } from "@stellar/stellar-sdk/rpc";
import { xdr } from "@stellar/stellar-sdk";
import { rpcUrl, stellarNetwork } from "../contracts/util";

/**
 * Concatenated `${contractId}:${topic}`
 */
type PagingKey = string;

/**
 * Paging tokens for each contract/topic pair. These can be mutated directly,
 * rather than being stored as state within the React hook.
 */
const paging: Record<
  PagingKey,
  { lastLedgerStart?: number; pagingToken?: string }
> = {};

// NOTE: Server is configured using envvars which shouldn't change during runtime
const server = new Server(rpcUrl, { allowHttp: stellarNetwork === "LOCAL" });

/**
 * Subscribe to events for a given topic from a given contract, using a library
 * generated with `soroban contract bindings typescript`.
 *
 * Someday such generated libraries will include functions for subscribing to
 * the events the contract emits, but for now you can copy this hook into your
 * React project if you need to subscribe to events, or adapt this logic for
 * non-React use.
 */
export function useSubscription(
  contractId: string,
  topic: string,
  onEvent: (event: Api.EventResponse) => void,
  pollInterval = 5000,
) {
  const id = `${contractId}:${topic}`;
  paging[id] = paging[id] || {};

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let stop = false;

    async function pollEvents(): Promise<void> {
      if (stop) return;

      // Stop network polling when the document/tab is hidden
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }

      try {
        if (!paging[id].lastLedgerStart) {
          const latestLedgerState = await server.getLatestLedger();
          paging[id].lastLedgerStart = latestLedgerState.sequence;
        }

        const request: Api.GetEventsRequest = {
          filters: [
            {
              contractIds: [contractId],
              topics: [[xdr.ScVal.scvSymbol(topic).toXDR("base64")]],
              type: "contract",
            },
          ],
          limit: 10,
        };

        if (paging[id].pagingToken) {
          request.cursor = paging[id].pagingToken;
        } else if (paging[id].lastLedgerStart) {
          request.startLedger = paging[id].lastLedgerStart;
        }

        const response = await server.getEvents(request);

        if (response.latestLedger) {
          paging[id].lastLedgerStart = response.latestLedger;
        }

        if (response.events && response.events.length > 0) {
          let latestTokenInBatch: string | undefined = undefined;

          for (const event of response.events) {
            const rawToken = (event as { pagingToken?: string }).pagingToken;
            if (rawToken && typeof rawToken === "string") {
              latestTokenInBatch = rawToken;
            }
            try {
              onEvent(event);
            } catch (error) {
              console.error(
                "Poll Events: subscription callback had error: ",
                error,
              );
            }
          }

          // Advance cursor explicitly per batch without corruption if callback throws
          if (latestTokenInBatch) {
            paging[id].pagingToken = latestTokenInBatch;
          }
        }
      } catch (error) {
        console.error("Poll Events: error: ", error);
      } finally {
        if (
          !stop &&
          (typeof document === "undefined" ||
            document.visibilityState !== "hidden")
        ) {
          timeoutId = setTimeout(() => void pollEvents(), pollInterval);
        }
      }
    }

    // Schedule immediate or interval polling on visibility change
    function handleVisibilityChange(): void {
      if (document.visibilityState === "visible") {
        if (timeoutId != null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        void pollEvents();
      } else {
        if (timeoutId != null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    void pollEvents();

    return () => {
      stop = true;
      if (timeoutId != null) clearTimeout(timeoutId);
      if (typeof document !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      }
    };
  }, [contractId, topic, onEvent, id, pollInterval]);
}
