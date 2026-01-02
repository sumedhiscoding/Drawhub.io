import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Users, Zap, WifiPen } from "lucide-react";
const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WifiPen strokeWidth={1.5} size={36} className="text-primary" />
            <h1 className="text-3xl font-bold text-foreground">DrawHub</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-6xl font-bold text-foreground mb-5 leading-tight">
            Create, Collaborate, and Share
            <span className="text-primary"> Your Ideas</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            A powerful whiteboard application for teams to brainstorm, design, and work together in real-time.
          </p>
          <div className="flex gap-3 justify-center">
            <Button size="lg" asChild className="text-base px-8 py-6">
              <Link to="/register">Start Creating</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8 py-6">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Card className="border-border">
            <CardHeader className="pb-4">
              <PenTool className="h-12 w-12 text-primary mb-3" />
              <CardTitle className="text-xl">Powerful Drawing Tools</CardTitle>
              <CardDescription className="text-sm">
                Draw, sketch, and create with a full suite of professional tools
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-4">
              <Users className="h-12 w-12 text-primary mb-3" />
              <CardTitle className="text-xl">Real-time Collaboration</CardTitle>
              <CardDescription className="text-sm">
                Work together with your team in real-time on shared whiteboards
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-4">
              <Zap className="h-12 w-12 text-primary mb-3" />
              <CardTitle className="text-xl">Lightning Fast</CardTitle>
              <CardDescription className="text-sm">
                Smooth performance and instant updates for the best experience
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;

