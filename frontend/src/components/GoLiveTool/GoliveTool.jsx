import React, { useState, useEffect, useRef } from "react";
import { Share2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useParams } from "react-router";
import axios from "axios";

const GoliveTool = () => {
  const { id: canvasId } = useParams();
  const [email, setEmail] = useState("");
  const [sharedUsers, setSharedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (canvasId) {
      fetchSharedUsers();
    }
  }, [canvasId]);

  const fetchSharedUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/canvas/shared-users/${canvasId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSharedUsers(response.data.sharedUsers || []);
    } catch (error) {
      // Only show error if it's not a permission error (non-owners can't see shared users)
      if (error.response?.status !== 403) {
        console.error("Error fetching shared users:", error);
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/canvas/share/${canvasId}`,
        { email: email.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(`Canvas shared with ${response.data.sharedUser.email}`);
      setEmail("");
      fetchSharedUsers(); // Refresh shared users list
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to share canvas. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-2 left-2 z-50">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shadow-md hover:bg-accent"
            title="Share your canvas"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-80 p-4 space-y-4"
        >
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Share Canvas</h3>
            <p className="text-xs text-muted-foreground">
              Invite others to collaborate on this canvas
            </p>
          </div>

          <form onSubmit={handleShare} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background text-foreground flex-1 pl-8"
                  placeholder="Enter email address"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground/90 cursor-pointer"
                disabled={loading || !email.trim()}
              >
                {loading ? "Sharing..." : "Share"}
              </Button>
            </div>
          </form>

          {sharedUsers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">
                Shared with:
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {sharedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                        {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.name || "User"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingUsers && sharedUsers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Loading shared users...
            </p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default GoliveTool;
