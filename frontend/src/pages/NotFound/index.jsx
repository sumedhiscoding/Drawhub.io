import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md text-center border-border">
        <CardContent className="py-14">
          <h1 className="text-7xl font-bold text-foreground mb-5">404</h1>
          <h2 className="text-3xl font-semibold text-foreground mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-8 text-base">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button asChild size="lg" className="h-11 px-8">
            <Link to="/" className="flex items-center justify-center">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;

