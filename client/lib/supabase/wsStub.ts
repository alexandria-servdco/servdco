/**
 * Browser stub for Rolldown false-positive `import ws from "ws"` hoists inside
 * @supabase/realtime-js error message strings. Native WebSocket is used at runtime.
 */
const WsStub =
  typeof WebSocket !== "undefined"
    ? WebSocket
    : class UnsupportedWebSocket {
        constructor() {
          throw new Error("WebSocket is not available in this environment.");
        }
      };

export default WsStub;
