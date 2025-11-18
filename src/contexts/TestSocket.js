// // TestSocket.js
// import { useEffect, useState } from "react";
// import { io } from "socket.io-client";

// const TestSocket = () => {
//   const [status, setStatus] = useState("Disconnected");
//   const [socket, setSocket] = useState(null);

//   useEffect(() => {
//     console.log("Testing direct socket connection to https://tronhanh-be.onrender.com");

//     const testSocket = io("https://tronhanh-be.onrender.com", {
//       transports: ["polling", "websocket"],
//     });

//     testSocket.on("connect", () => {
//       console.log("Test socket connected!");
//       setStatus("Connected");
//       testSocket.emit("add-user", "test-user-123");
//     });

//     testSocket.on("disconnect", () => {
//       console.log("Test socket disconnected");
//       setStatus("Disconnected");
//     });

//     testSocket.on("connect_error", (error) => {
//       console.error("Test socket connection error:", error);
//       setStatus(`Error: ${error.message}`);
//     });

//     setSocket(testSocket);

//     return () => {
//       testSocket.disconnect();
//     };
//   }, []);

//   return (
//     <div style={{ padding: 20, backgroundColor: "yellow" }}>
//       <h3>Socket Test</h3>
//       <p>Status: {status}</p>
//       <p>Socket ID: {socket?.id || "None"}</p>
//     </div>
//   );
// };

// export default TestSocket;
