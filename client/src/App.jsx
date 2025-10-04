import { Route, Routes } from "react-router-dom";
import Homepage, { QuestionsPage } from "./components/HomePage/Homepage";
import Login from "./pages/Login/Login";
import SignUp from "./pages/SignUp/SignUp";
import UnifiedQA from "./pages/UnifiedQA/UnifiedQA";
import EditAnswer from "./pages/EditAnswer/EditAnswer";
import EditQuestion from "./pages/EditQuestion/EditQuestion";
import ForgetPassword from "./pages/ForgetPassword/ForgetPassword";
import HowItWorks from "./pages/HowItWorks/HowItWorks";
import AccessDenied from "./pages/AccessDenied/AccessDenied";
import OAuthSuccess from "./pages/OAuthSuccess/OAuthSuccess";
import ProtectedRoute, { AdminRoute, ModeratorRoute } from "./context/ProtectedRoutes";
import UserProvider from "./context/UserProvider";
import QuestionProvider from "./context/QuestionProvider";
import Header from "./components/Header/Header";
import ApiDemo from "./components/ApiDemo/ApiDemo";
import SecurityDashboard from "./components/SecurityDashboard/SecurityDashboard";
import AskQuestion from "./pages/AskQuestion/AskQuestion";
import QuestionDetail from "./pages/QuestionDetail/QuestionDetail";

import "./App.css";


function App() {
  return (
    <UserProvider>
      <QuestionProvider>
        <Header />
        <main className="main-content">
          <Routes>
         {/* Public Routes */}
         <Route path="/" element={<Homepage />} />
         <Route path="/login" element={<Login />} />
         <Route path="/signup" element={<SignUp />} />
         <Route path="/forget-password" element={<ForgetPassword />} />
         <Route path="/how-it-works" element={<HowItWorks />} />
         <Route path="/access-denied" element={<AccessDenied />} />
         <Route path="/oauth-success" element={<OAuthSuccess />} />

         {/* Protected Routes - Basic Authentication Required */}
         <Route
           path="/questions"
           element={
             <ProtectedRoute>
               <UnifiedQA />
             </ProtectedRoute>
           }
         />
         <Route
           path="/questions/:id"
           element={<QuestionDetail />}
         />
         <Route
           path="/ask-question"
           element={
             <ProtectedRoute>
               <AskQuestion />
             </ProtectedRoute>
           }
         />

         {/* Temporary Public Route for Testing */}
         <Route
           path="/test-questions"
           element={<UnifiedQA />}
         />

         {/* Protected Routes - Moderator Access Required */}
         <Route
           path="/edit-answer/:id"
           element={
             <ModeratorRoute>
               <EditAnswer />
             </ModeratorRoute>
           }
         />

         {/* Edit Question Route - Public for Demo */}
         <Route
           path="/edit-question/:id"
           element={<EditQuestion />}
         />

         {/* Example of Permission-based Route */}
         <Route
           path="/admin/*"
           element={
             <AdminRoute
               requiredPermissions={['manage_users', 'manage_content']}
               fallbackPath="/access-denied"
             >
             
             </AdminRoute>
           }
         />

         {/* Example of Public Route with Optional Auth */}
         <Route
           path="/profile"
           element={
             <ProtectedRoute requireAuth={false}>
               {/* This route works for both authenticated and non-authenticated users */}
               <div>User Profile</div>
             </ProtectedRoute>
           }
         />

         {/* API Demo Route - Shows enhanced axios features */}
         <Route
           path="/api-demo"
           element={<ApiDemo />}
         />

         {/* Security Dashboard - Advanced security monitoring */}
         <Route
           path="/security-dashboard"
           element={
             <AdminRoute>
               <SecurityDashboard />
             </AdminRoute>
           }
         />
         </Routes>
       </main>
     </QuestionProvider>
   </UserProvider>
 );
}

export default App;