import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { Plus, LogOut, PenTool, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [newCanvasName, setNewCanvasName] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      navigate("/login");
      return;
    }

    setUser(JSON.parse(userData));
    fetchCanvases();
  }, [navigate]);

  const fetchCanvases = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/canvas/get-all-by-owner-id`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCanvases(response.data.canvases || []);
    } catch (error) {
      console.error("Error fetching canvases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCanvas = async (id) => {
    try {
      console.log("canvas id", id);
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${import.meta.env.VITE_API_URL}/canvas/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchCanvases();
      toast.success(response.data.message || "Canvas deleted successfully");
    }
    catch (error) {
      console.error("Error deleting canvas:", error);
      toast.error(
        error.response?.data?.error ||
          "Failed to delete canvas. Please try again."
      );
    }
  };

  const handleCreateCanvas = async (e) => {
    e.preventDefault();
    if (!newCanvasName.trim()) {
      toast.error("Canvas name is required");
      return
    };

    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/canvas/create`,
        {
          name: newCanvasName.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNewCanvasName("");
      fetchCanvases();
      // Navigate to the new canvas
      navigate(`/canvas/${response.data.canvas.id}`);
    } catch (error) {
      console.error("Error creating canvas:", error);
      toast.error(
        error.response?.data?.error ||
          "Failed to create canvas. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-primary mx-auto"></div>
          <p className="mt-5 text-muted-foreground text-base">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PenTool className="h-9 w-9 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">DrawHub</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.name}
              </span>
              <Button variant="outline" onClick={handleLogout} className="h-9">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-6">
        {/* Create New Canvas */}
        <Card className="mb-6 border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Create New Canvas</CardTitle>
            <CardDescription className="text-sm">
              Start a new whiteboard to begin drawing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCanvas} className="flex gap-3">
              <Input
                placeholder="Enter canvas name..."
                value={newCanvasName}
                onChange={(e) => setNewCanvasName(e.target.value)}
                className="flex-1 h-11 text-base"
              />
              <Button type="submit" disabled={creating} className="h-11 px-6">
                <Plus className="h-4 w-4 mr-2" />
                {creating ? "Creating..." : "Create Canvas"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* My Canvases */}
        <div>
          <h2 className="text-3xl font-bold mb-5 text-foreground">
            My Canvases
          </h2>
          {canvases.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-14 text-center">
                <PenTool className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground mb-3 text-base">
                  You don't have any canvases yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Create your first canvas to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {canvases.map((canvas) => (
                <Card
                  key={canvas.id}
                  className="hover:shadow-xl transition-all border-border hover:border-primary/50"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl flex items-center justify-between">
                      <span>{canvas.name}</span>
                      <Button
                        variant="outline"
                        className="bg-red-700/70 h-9 text-white hover:bg-red-800/70 hover:text-white cursor-pointer"
                        onClick={() => handleDeleteCanvas(canvas.id)}
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Created {new Date(canvas.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full h-10">
                      <Link to={`/canvas/${canvas.id}`}>Open Canvas</Link>
                    </Button>
                    {canvas.shared_with_ids?.length > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Share2 className="h-3.5 w-3.5" />
                        Shared with {canvas.shared_with_ids.length} user(s)
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
