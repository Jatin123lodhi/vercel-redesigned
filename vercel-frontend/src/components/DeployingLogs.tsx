import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Clock } from "lucide-react";
import io from "socket.io-client";

interface LogMessage {
  message: string;
}

export function DeployingLogs({ projectSlug, isDeploying, setIsDeployed, setIsDeploying, resetInputForm }: { projectSlug: string, isDeploying: boolean, setIsDeployed: (isDeployed: boolean) => void, setIsDeploying: (isDeploying: boolean) => void, resetInputForm: () => void }) {
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [timer, setTimer] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDeploying && !isComplete) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDeploying, isComplete]);

  useEffect(() => {
    // Create socket connection
    const newSocket = io("http://localhost:9000", {
      transports: ['websocket'],
      withCredentials: true
    });

    // Handle connection
    newSocket.on("connect", () => {
      console.log("Connected to socket server");
      // Subscribe to the project's channel
      newSocket.emit("subscribe", `logs:${projectSlug}`);
    });

    // Listen for messages
    newSocket.on("message", (msg: LogMessage) => {
      console.log("Received message:", msg);
      setMessages(prev => [...prev, msg]);
    });

    newSocket.on("deployed", () => {
      setIsComplete(true);
      setIsDeployed(true);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [projectSlug]);

  if (!isDeploying) return null;

  return (
    <Card className="w-[550px]">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Deployment Logs</CardTitle>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>{timer}s</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 border min-h-28 max-h-72 p-4 rounded overflow-y-scroll [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:!h-[30px] hover:[&::-webkit-scrollbar-thumb]:bg-gray-200">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-gray-500 text-sm">
              <div className="animate-pulse">Waiting for deployment logs...</div>
              <div className="text-xs mt-2">This might take a few seconds</div>
            </div>
          ) : (
            <ul className="space-y-1">
              {messages.map((msg, index) => (
                <li key={index} className="font-mono text-sm">
                  {typeof msg.message === 'string' ? msg.message : JSON.stringify(msg.message)}
                </li>
              ))}
              <div ref={logsEndRef} />
            </ul>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-2 w-full">
          {!isComplete ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Deploying...</span>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full" />
                <span className="text-sm text-green-500">Deployment Complete!</span>
              </div>
              <Button 
                variant="outline"
                onClick={() => {
                  setIsDeploying(false);
                  setIsDeployed(false);
                  setMessages([]);
                  setIsComplete(false);
                  setTimer(0);
                  resetInputForm();
                }}
              >
                Deploy Another Project
              </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

