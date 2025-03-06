import { InputFormCard } from "@/components/InputFormCard"
import { DeployedProjectCard } from "@/components/DeployedProjectCard"
import { DeployingLogs } from "@/components/DeployingLogs"
import { useState, useCallback } from "react";

function App() {
  const [projectSlug, setProjectSlug] = useState<string>("");
  const [projectUrl, setProjectUrl] = useState<string>("");
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [isDeployed, setIsDeployed] = useState<boolean>(false);
  const [resetInputForm, setResetInputForm] = useState<(() => void) | null>(null);

  const handleReset = useCallback((resetFn: () => void) => {
    setResetInputForm(() => resetFn);
  }, []);

  return (
    <div className="bg-black">
      <div className="text-white text-2xl font-bold text-center py-4 w-full">Vercel</div>
      <div className="flex flex-col gap-8 items-center min-h-svh py-16">
        <InputFormCard 
          setProjectSlug={setProjectSlug} 
          setProjectUrl={setProjectUrl} 
          setIsDeploying={setIsDeploying} 
          isDeploying={isDeploying} 
          isDeployed={isDeployed}
          onReset={handleReset}
        />
        {isDeployed ? <DeployedProjectCard projectUrl={projectUrl} /> : null}
        <DeployingLogs 
          projectSlug={projectSlug} 
          isDeploying={isDeploying} 
          setIsDeployed={setIsDeployed} 
          setIsDeploying={setIsDeploying}
          resetInputForm={() => resetInputForm?.()}
        />
      </div>
    </div>
  )
}

export default App
