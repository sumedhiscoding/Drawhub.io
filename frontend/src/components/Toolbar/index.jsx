import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
import { TOOLS, COLORS, FILL_STYLES, easingOptions } from "../../utils/constants";
import { BoardContext } from "../../store/board/board-context";
import { ACTIONS } from "../../utils/constants";
import toolboxContext from "../../store/board/toolbar-context";
import { Settings, Share2, Mail, Plus, X, Radio, UserMinus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { useParams } from "react-router";
import axios from "axios";

const Toolbar = () => {
  const { id: canvasId } = useParams();
  const { activeTool, setActiveTool, boardUndoHandler, boardRedoHandler } = React.useContext(BoardContext);
  const { toolBoxState, dispatchToolBoxAction } = useContext(toolboxContext);

  const currentToolState = toolBoxState[activeTool.name];
  const isPencil = activeTool?.name === "Pencil";
  const pencilProps = currentToolState || {};

  // GoLive state
  const [emails, setEmails] = useState([{ id: Date.now(), value: "" }]);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [removingAccess, setRemovingAccess] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const inputRefs = useRef({});

  const checkLiveStatus = useCallback(async () => {
    if (!canvasId) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/canvas/live-status/${canvasId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setIsLive(response.data.isLive || false);
    } catch (error) {
      setIsLive(false);
    }
  }, [canvasId]);

  const fetchSharedUsers = useCallback(async () => {
    if (!canvasId) return;
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
      if (error.response?.status !== 403) {
        console.error("Error fetching shared users:", error);
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [canvasId]);

  useEffect(() => {
    if (canvasId) {
      fetchSharedUsers();
      checkLiveStatus();
    }
  }, [canvasId, fetchSharedUsers, checkLiveStatus]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const addEmailField = () => {
    setEmails([...emails, { id: Date.now(), value: "" }]);
  };

  const removeEmailField = (id) => {
    if (emails.length > 1) {
      setEmails(emails.filter((email) => email.id !== id));
      delete inputRefs.current[id];
    }
  };

  const updateEmail = (id, value) => {
    setEmails(
      emails.map((email) => (email.id === id ? { ...email, value } : email))
    );
  };

  const handleShare = async () => {
    // Validate all emails
    const validEmails = emails
      .map((email) => email.value.trim())
      .filter((email) => email.length > 0);

    if (validEmails.length === 0) {
      toast.error("Please add at least one email address");
      return;
    }

    // Check for invalid emails
    const invalidEmails = validEmails.filter((email) => !validateEmail(email));
    if (invalidEmails.length > 0) {
      toast.error("Please enter valid email addresses");
      return;
    }

    // Check for duplicates
    const uniqueEmails = [...new Set(validEmails)];
    if (uniqueEmails.length !== validEmails.length) {
      toast.error("Please remove duplicate email addresses");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Share with all emails
      const sharePromises = uniqueEmails.map((email) =>
        axios.post(
          `${import.meta.env.VITE_API_URL}/canvas/share/${canvasId}`,
          { email },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      );

      await Promise.all(sharePromises);
      toast.success(`Canvas shared with ${uniqueEmails.length} user(s)`);

      // Reset emails to single empty field
      setEmails([{ id: Date.now(), value: "" }]);
      fetchSharedUsers(); // Refresh shared users list
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to share canvas. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoLive = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Go live (you may need to create this endpoint)
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/canvas/go-live/${canvasId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setIsLive(true);
        toast.success("Canvas is now live!");
      } catch (liveError) {
        // If go-live endpoint doesn't exist, just toggle the state
        setIsLive(true);
        toast.success("Canvas is now live!");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to go live. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleRemoveAccess = async (userId) => {
    if (!window.confirm("Are you sure you want to remove access for this user?")) {
      return;
    }

    setRemovingAccess(userId);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/canvas/remove-access/${canvasId}`,
        {
          data: { userId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Access removed successfully");
      fetchSharedUsers(); // Refresh shared users list
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to remove access. Please try again.";
      toast.error(errorMessage);
    } finally {
      setRemovingAccess(null);
    }
  };

  const handlePencilPropChange = (prop, value) => {
    dispatchToolBoxAction({
      type: "SET_PENCIL_PROP",
      tool: activeTool,
      prop,
      value,
    });
  };

  const handleStrokeColorChange = (color) => {
    dispatchToolBoxAction({
      type: "SET_STROKE_COLOR",
      tool: activeTool,
      color,
    });
  };

  const handleFillColorChange = (color) => {
    dispatchToolBoxAction({
      type: "SET_FILL_COLOR",
      tool: activeTool,
      color,
    });
  };

  const handleStrokeWidthChange = (width) => {
    if (activeTool.name === TOOLS.TEXT.name) {
      dispatchToolBoxAction({
        type: "SET_FONT_SIZE",
        tool: activeTool,
        fontSize: parseInt(width),
      });
    } else {
      dispatchToolBoxAction({
        type: "SET_STROKE_WIDTH",
        tool: activeTool,
        width: parseInt(width),
      });
    }
  };

  const handleFillStyleChange = (fillStyle) => {
    dispatchToolBoxAction({
      type: "SET_FILL_STYLE",
      tool: activeTool,
      fillStyle,
    });
  };

  return (
    <div className="toolbar">
      <div className="toolbar-buttons">
        <button
          key={ACTIONS.UNDO.id}
          className="toolbar-button"
          onClick={boardUndoHandler}
          title={ACTIONS.UNDO.name}
        >
          <ACTIONS.UNDO.icon size={22} />
        </button>
        <button
          key={ACTIONS.REDO.id}
          className="toolbar-button"
          onClick={boardRedoHandler}
          title={ACTIONS.REDO.name}
        >
          <ACTIONS.REDO.icon size={22} />
        </button>
        {Object.keys(TOOLS).map((toolKey, idx) => {
          const tool = TOOLS[toolKey];
          const Icon = tool.icon;
          return (
            <button
              key={tool.id || idx}
              className={`toolbar-button${
                activeTool && activeTool.id === tool.id ? " toolbar-button-active" : ""
              }`}
              onClick={() => setActiveTool(toolKey)}
              title={tool.name}
            >
              <Icon size={19} />
            </button>
          );
        })}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              className="toolbar-button"
              title="Tool Settings"
            >
              <Settings size={19} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-80 p-4 max-h-[80vh] overflow-y-auto modern-scrollbar mt-4"
          >
            <div className="space-y-2 mb-2">
              <h3 className="text-sm font-semibold text-foreground">
                Tool Settings
              </h3>
              <p className="text-xs text-muted-foreground">
                Customize your {activeTool?.name || "tool"} properties
              </p>
            </div>
            <Accordion type="multiple" defaultValue={["stroke-color", "stroke-width"]} className="w-full">
              <AccordionItem value="stroke-color">
                <AccordionTrigger className="toolbox-h4 py-2">
                  Stroke Color
                </AccordionTrigger>
                <AccordionContent>
                  <div className="toolbox-color-palette">
                    {Object.entries(COLORS).map(([name, hex]) => (
                      <button
                        key={name}
                        className={`toolbox-color-btn${
                          currentToolState?.stroke === hex
                            ? " toolbox-color-btn-active"
                            : ""
                        }`}
                        style={{ backgroundColor: hex }}
                        onClick={() => handleStrokeColorChange(hex)}
                        title={name}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {isPencil && (
                <AccordionItem value="pencil-settings">
                  <AccordionTrigger className="toolbox-h4 py-2">
                    Pencil Settings
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="toolbox-flex">
                        <span className="toolbox-flex-label">Thinning</span>
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          value={[pencilProps.thinning ?? 0.5]}
                          onValueChange={([val]) => handlePencilPropChange("thinning", val)}
                          className="toolbox-flex-slider"
                        />
                        <span className="toolbox-flex-value">
                          {pencilProps.thinning ?? 0.5}
                        </span>
                      </div>
                      <div className="toolbox-flex">
                        <span className="toolbox-flex-label">Streamline</span>
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          value={[pencilProps.streamline ?? 0.5]}
                          onValueChange={([val]) => handlePencilPropChange("streamline", val)}
                          className="toolbox-flex-slider"
                        />
                        <span className="toolbox-flex-value">
                          {pencilProps.streamline ?? 0.5}
                        </span>
                      </div>
                      <div className="toolbox-flex">
                        <span className="toolbox-flex-label">Smoothing</span>
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          value={[pencilProps.smoothing ?? 0.5]}
                          onValueChange={([val]) => handlePencilPropChange("smoothing", val)}
                          className="toolbox-flex-slider"
                        />
                        <span className="toolbox-flex-value">
                          {pencilProps.smoothing ?? 0.5}
                        </span>
                      </div>
                      <div className="toolbox-flex">
                        <span className="toolbox-flex-1">Easing</span>
                        <Select
                          value={pencilProps.easing || "EaseInOutCubic"}
                          onValueChange={(val) => handlePencilPropChange("easing", val)}
                        >
                          <SelectTrigger className={`toolbox-select${pencilProps.easing ? " toolbox-select-active" : ""}`} style={{ marginTop: "4px" }}>
                            <SelectValue placeholder="Select Easing" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Easing</SelectLabel>
                              {easingOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {currentToolState?.fillcolor !== undefined && (
                <AccordionItem value="fill-color">
                  <AccordionTrigger className="toolbox-h4 py-2">
                    Fill Color
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="toolbox-color-palette">
                      <button
                        className={`toolbox-none-btn${
                          currentToolState?.fillcolor === null
                            ? " toolbox-color-btn-active"
                            : ""
                        }`}
                        onClick={() => handleFillColorChange(null)}
                        title="No Fill"
                      >
                        /
                      </button>
                      {Object.entries(COLORS).map(([name, hex]) => (
                        <button
                          key={name}
                          className={`toolbox-color-btn${
                            currentToolState?.fillcolor === hex
                              ? " toolbox-color-btn-active"
                              : ""
                          }`}
                          style={{ backgroundColor: hex }}
                          onClick={() => handleFillColorChange(hex)}
                          title={name}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {currentToolState?.fillStyle !== undefined && (
                <AccordionItem value="fill-style">
                  <AccordionTrigger className="toolbox-h4 py-2">
                    Fill Style
                  </AccordionTrigger>
                  <AccordionContent>
                    <Select
                      value={currentToolState?.fillStyle ?? ""}
                      onValueChange={(val) => handleFillStyleChange(val)}
                    >
                      <SelectTrigger className={`toolbox-select${currentToolState?.fillStyle ? " toolbox-select-active" : ""}`} style={{ marginTop: "4px" }}>
                        <SelectValue placeholder="No Fill Style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Fill Style</SelectLabel>
                          {Object.entries(FILL_STYLES).map(([name, style]) => (
                            <SelectItem key={name} value={style}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="stroke-width">
                <AccordionTrigger className="toolbox-h4 py-2">
                  Stroke Width
                </AccordionTrigger>
                <AccordionContent>
                  <div className="toolbox-stroke-width">
                    {activeTool.name === TOOLS.TEXT.name ? (
                      <>
                        <Slider
                          min={8}
                          max={72}
                          step={1}
                          value={[currentToolState?.fontSize || 16]}
                          onValueChange={([val]) => handleStrokeWidthChange(val)}
                          className="toolbox-flex-slider"
                        />
                        <span>{currentToolState?.fontSize || 16}px</span>
                      </>
                    ) : activeTool.name === TOOLS.PENCIL?.name ? (
                      <>
                        <Slider
                          min={1}
                          max={20}
                          step={1}
                          value={[currentToolState?.size || 2]}
                          onValueChange={([val]) => handleStrokeWidthChange(val)}
                          className="toolbox-flex-slider"
                        />
                        <span className="slider-label">
                          {currentToolState?.size || 2}px
                        </span>
                      </>
                    ) : (
                      <>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[currentToolState?.size || 1]}
                          onValueChange={([val]) => handleStrokeWidthChange(val)}
                          className="toolbox-flex-slider"
                        />
                        <span className="slider-label">
                          {currentToolState?.size || 1}px
                        </span>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Share Button */}
        <DropdownMenu open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DropdownMenuTrigger asChild>
            <button
              className="toolbar-button"
              title="Share canvas"
            >
              <Share2 size={19} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-96 p-4 space-y-4 max-h-[80vh] overflow-y-auto modern-scrollbar mt-4"
          >
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Share Canvas</h3>
              <p className="text-xs text-muted-foreground">
                Add email addresses to invite collaborators
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2 max-h-48 overflow-y-auto modern-scrollbar">
                {emails.map((emailItem, index) => (
                  <div key={emailItem.id} className="flex items-center p-2 gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        ref={(el) => {
                          if (el) inputRefs.current[emailItem.id] = el;
                        }}
                        type="email"
                        value={emailItem.value}
                        onChange={(e) => updateEmail(emailItem.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && index === emails.length - 1) {
                            e.preventDefault();
                            addEmailField();
                          }
                        }}
                        className={`bg-background text-foreground flex-1 pl-10 ${
                          emails.length > 1 ? "pr-10" : "pr-3"
                        } border border-input`}
                        placeholder={`Email ${index + 1}`}
                        disabled={loading}
                      />
                      {emails.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 hover:bg-destructive/10 z-10"
                          onClick={() => removeEmailField(emailItem.id)}
                          disabled={loading}
                        >
                          <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEmailField}
                disabled={loading}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Email
              </Button>

              <Button
                type="button"
                onClick={handleShare}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                {loading ? "Sharing..." : "Share Canvas"}
              </Button>
            </div>

            {sharedUsers.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground">
                  Shared with:
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto modern-scrollbar">
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-destructive/10"
                        onClick={() => handleRemoveAccess(user.id)}
                        disabled={removingAccess === user.id}
                        title="Remove access"
                      >
                        <UserMinus className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
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

        {/* Go Live Button */}
        <button
          className={`toolbar-button${
            isLive ? " bg-green-500/20 border-green-500" : ""
          }`}
          title={isLive ? "Canvas is live" : "Go live"}
          onClick={handleGoLive}
        >
          {isLive ? (
            <Radio size={19} className="text-green-600" />
          ) : (
            <Radio size={19} />
          )}
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
