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
import axios from "axios"
import { useState, useEffect } from "react"
import { Rocket } from "lucide-react"

interface InputFormCardProps {
  setProjectSlug: (slug: string) => void;
  setProjectUrl: (url: string) => void;
  setIsDeploying: (isDeploying: boolean) => void;
  isDeploying: boolean;
  isDeployed: boolean;
  onReset: (resetFn: () => void) => void;
}

export function InputFormCard({ setProjectSlug, setProjectUrl, setIsDeploying, isDeploying, isDeployed, onReset }: InputFormCardProps) {
  const [gitUrl, setGitUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
 
  // const mockServerUrl = `https://f0791d4d-1a52-4dba-9801-6a375b2ca1e7.mock.pstmn.io`
  const apiServerUrl = `http://localhost:9000`

  useEffect(() => {
    onReset(() => setGitUrl(""));
  }, [onReset]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
     
    setIsLoading(true)
    
    try {
     
      const response = await axios.post(`${apiServerUrl}/project`,{
        gitURL: gitUrl
      })
      console.log(response, ' response')
      if(response.status === 200){
        setProjectSlug(response.data.data.projectSlug)
        setProjectUrl(response.data.data.url)
        setIsDeploying(true)
      }
    } catch (error) {
      console.log(error, ' error')
    } finally {
      setIsLoading(false)
    }
  }
  if(isDeployed) return null
  return (
    <Card className="w-[420px]">
      <CardHeader>
        <CardTitle>Deploy your project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Github URL</Label>
              <Input required id="name" placeholder="Enter Github URL" value={gitUrl} onChange={(e) => setGitUrl(e.target.value)} />
            </div>
          </div>
        </CardContent>
      <CardFooter className="flex mt-6">
        <Button type="submit" disabled={isLoading || isDeploying} className="w-full cursor-pointer">
          {(isLoading || isDeploying) ? (
            <>
              <Rocket className="mr-2 h-4 w-4 animate-bounce" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-4 w-4" />
              Deploy
            </>
          )}
        </Button>
      </CardFooter>
      </form>
    </Card>
  )
}
