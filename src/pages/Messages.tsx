import { motion } from 'framer-motion';
import { MessageCircle, Search, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConversations } from '@/hooks/useMessages';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGroups } from '@/hooks/useGroups';
import { CreateGroupDialog } from '@/components/chat/CreateGroupDialog';
const Messages = () => {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const { data: conversations, isLoading } = useConversations(currentUser?.id);
  const { myCollegeGroups, otherCollegeGroups, isLoading: isLoadingGroups } = useGroups();

  const [activeTab, setActiveTab] = useState<'primary' | 'general' | 'groups'>('primary');
  const [activeGroupTab, setActiveGroupTab] = useState<'my-college' | 'other-colleges'>('my-college');

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [createGroupType, setCreateGroupType] = useState<'my-college' | 'other-colleges'>('my-college');

  // Filter conversations
  const primaryConversations = conversations?.filter(
    c => c.user.college === currentUser?.college
  ) || [];

  const generalConversations = conversations?.filter(
    c => c.user.college !== currentUser?.college
  ) || [];

  // Group handling
  const handleCreateGroup = (type: 'my-college' | 'other-colleges') => {
    setCreateGroupType(type);
    setIsCreateGroupOpen(true);
  };

  const getActiveList = () => {
    switch (activeTab) {
      case 'primary': return primaryConversations;
      case 'general': return generalConversations;
      case 'groups': return []; // Groups handled separately in render
      default: return [];
    }
  };

  const activeList = getActiveList();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Messages</h1>
            </div>
          </div>

          {/* Search */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-9 h-10"
            />
          </div>

          {/* Tabs */}
          <div className="flex p-1 mt-4 bg-muted/50 rounded-xl">
            <button
              onClick={() => setActiveTab('primary')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'primary'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Our College
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'general'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Other Colleges
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'groups'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Groups
            </button>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto">
        {activeTab === 'groups' ? (
          <div className="space-y-4">
            {/* Group Sub-tabs */}
            <div className="flex gap-2 p-1 overflow-x-auto mx-4 scrollbar-hide">
              <button
                onClick={() => setActiveGroupTab('my-college')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${activeGroupTab === 'my-college'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
                  }`}
              >
                My College
              </button>
              <button
                onClick={() => setActiveGroupTab('other-colleges')}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${activeGroupTab === 'other-colleges'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
                  }`}
              >
                Other Colleges
              </button>
            </div>

            <div className="p-4">
              {activeGroupTab === 'my-college' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      🏫 My College Groups
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-primary"
                      onClick={() => handleCreateGroup('my-college')}
                    >
                      Create
                    </Button>
                  </div>

                  {isLoadingGroups ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : myCollegeGroups && myCollegeGroups.length > 0 ? (
                    <div className="divide-y divide-border">
                      {myCollegeGroups.map((group) => (
                        <div key={group.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => navigate(`/feed/messages/group/${group.id}`)}>
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                            👯
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{group.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{group.description || 'No description'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                      <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-sm">No groups in your college yet</p>
                    </div>
                  )}
                </div>
              )}

              {activeGroupTab === 'other-colleges' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      🏢 Other College Groups
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-primary"
                      onClick={() => handleCreateGroup('other-colleges')}
                    >
                      Create
                    </Button>
                  </div>

                  {isLoadingGroups ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : otherCollegeGroups && otherCollegeGroups.length > 0 ? (
                    <div className="divide-y divide-border">
                      {otherCollegeGroups.map((group) => (
                        <div key={group.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => navigate(`/feed/messages/group/${group.id}`)}>
                          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-xl">
                            🌍
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{group.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{group.description || 'No description'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                      <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-sm">Create groups with students from other colleges</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Normal Conversations List */
          isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : activeList.length > 0 ? (
            <div className="divide-y divide-border">
              {activeList.map((conv, index) => (
                <motion.div
                  key={conv.user.id}
                  onClick={() => navigate(`/feed/messages/${conv.user.id}`)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="relative">
                    <img
                      src={conv.user.profile_photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'}
                      alt={conv.user.name || 'User'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {conv.unread && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full ring-2 ring-card" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold text-sm ${conv.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {conv.user.name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-muted-foreground">{conv.time}</span>
                    </div>
                    <p className={`text-sm truncate ${conv.unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {conv.lastMessage}
                    </p>
                  </div>

                  {conv.unread && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No messages in this category yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start a conversation!</p>
            </div>
          )
        )}
      </div>

      <CreateGroupDialog
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        type={createGroupType}
      />
    </div>
  );
};

export default Messages;
