import React from 'react';
import { Share2, Mail, Plus, X, UserMinus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Component for sharing canvas with email addresses
 * @param {Object} shareProps - Props from useToolBarHandlers hook
 */
const ShareDialog = ({ shareProps }) => {
  const {
    emails,
    addEmailField,
    removeEmailField,
    updateEmail,
    inputRefs,
    handleShare,
    loading,
    sharedUsers,
    loadingUsers,
    handleRemoveAccess,
    removingAccess,
  } = shareProps;

  const [showShareDialog, setShowShareDialog] = React.useState(false);

  return (
    <DropdownMenu open={showShareDialog} onOpenChange={setShowShareDialog}>
      <DropdownMenuTrigger asChild>
        <button className="toolbar-button" title="Share canvas">
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
                      if (el) {
                        inputRefs.current[emailItem.id] = el;
                      }
                    }}
                    type="email"
                    value={emailItem.value}
                    onChange={(e) => updateEmail(emailItem.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && index === emails.length - 1) {
                        e.preventDefault();
                        addEmailField();
                      }
                    }}
                    className={`bg-background text-foreground flex-1 pl-10 ${
                      emails.length > 1 ? 'pr-10' : 'pr-3'
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
            {loading ? 'Sharing...' : 'Share Canvas'}
          </Button>
        </div>

        {sharedUsers.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-xs font-semibold text-muted-foreground">Shared with:</h4>
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
                      <p className="font-medium">{user.name || 'User'}</p>
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
          <p className="text-xs text-muted-foreground text-center py-2">Loading shared users...</p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareDialog;
