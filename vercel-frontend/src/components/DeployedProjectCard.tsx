import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import ReactConfetti from 'react-confetti'
import { Copy, Check } from "lucide-react"

export function DeployedProjectCard({projectUrl}: {projectUrl: string}) {
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000); // Stop confetti after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(projectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
    
  return (
    <>
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={['#4ade80', '#22c55e', '#16a34a', '#15803d']}
          style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none' }}
        />
      )}
      <Card className="w-[550px] relative z-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Project deployed successfully
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Project URL</Label>
              <div className="flex gap-2">
                <Input 
                  id="name" 
                  value={projectUrl} 
                  readOnly 
                  className="cursor-pointer" 
                  onClick={handleCopy}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {copied && (
                <p className="text-sm text-green-500">URL copied to clipboard!</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
