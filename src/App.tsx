import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Connect from "./pages/Connect";
import AppLayout from "./components/layout/AppLayout";
import CampusFeed from "./pages/CampusFeed";
import OldStudentsFeed from "./pages/OldStudentsFeed";
import ProjectsFeed from "./pages/ProjectsFeed";
import OtherCollegesFeed from "./pages/OtherCollegesFeed";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Chat from "./pages/Chat";
import GroupChatPage from "./pages/GroupChatPage";
import NotFound from "./pages/NotFound";
import FindPeople from "./pages/FindPeople";
import Verification from "./pages/Verification";
import PostDetails from "./pages/PostDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/verification" element={<Verification />} />

          {/* App Routes with Layout */}
          <Route path="/feed" element={<AppLayout />}>
            <Route index element={<CampusFeed />} />
            <Route path="old-students" element={<OldStudentsFeed />} />
            <Route path="projects" element={<ProjectsFeed />} />
            <Route path="other-colleges" element={<OtherCollegesFeed />} />
            <Route path="messages" element={<Messages />} />
            <Route path="messages/:userId" element={<Chat />} />
            <Route path="messages/group/:groupId" element={<GroupChatPage />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:userId" element={<UserProfile />} /> {/* Public Profile Route */}
            <Route path="people" element={<FindPeople />} />
            <Route path="post/:postId" element={<PostDetails />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
