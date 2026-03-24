import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';

interface GoogleJwtPayload {
  email: string;
  name: string;
  sub: string;
  picture?: string;
}

export default function LoginPage() {
  const { setGoogleUser, login } = useAuth();
  const googleLoginMutation = useMutation(api.users.googleLogin);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setLoading(true);
      const decoded = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);
      
      const userId = await googleLoginMutation({
        email: decoded.email,
        name: decoded.name,
        googleId: decoded.sub,
        picture: decoded.picture,
      });

      if (userId) {
        setGoogleUser(userId);
        toast.success(`Welcome back, ${decoded.name.split(' ')[0]}!`);
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Failed to log in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-sm animate-in slide-in-from-bottom-8 duration-700 fade-in z-10 relative">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/25 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 w-full h-full rounded-3xl animate-pulse" />
            <span className="text-white font-extrabold text-3xl tracking-tighter mix-blend-overlay">AR</span>
          </div>
          <h1 className="text-3xl font-black text-foreground leading-tight tracking-tight mb-2">Ananda Rath</h1>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest bg-secondary/80 inline-block px-3 py-1 rounded-full border border-border/50">
            Trip Expense Manager
          </p>
        </div>

        <div className="bg-card/70 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl shadow-black/5 border border-white/20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome</h2>
            <p className="text-sm text-muted-foreground">Sign in or create an account to manage your trips and expenses.</p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4">
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-left w-full">
                <h3 className="text-rose-500 font-bold mb-2">⚠️ Google Auth Not Configured</h3>
                <p className="text-xs text-muted-foreground mb-3 text-balance leading-relaxed">
                  To enable Google Sign-In, you must provide your own Google Client ID in your environment variables.
                </p>
                <ol className="text-[11px] text-muted-foreground font-medium space-y-2 list-decimal list-inside pl-3">
                  <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-primary underline">Google Cloud Console</a></li>
                  <li>Enable <strong>Google Auth API</strong> and create an <strong>OAuth client ID</strong> (Web application)</li>
                  <li>Add <code className="bg-secondary px-1 py-0.5 rounded text-foreground">http://localhost:8080</code> to Authorized JavaScript origins</li>
                  <li>Copy your Client ID and open the <code className="bg-secondary px-1 py-0.5 rounded text-foreground">.env.local</code> file in this project folder</li>
                  <li>Add <code className="bg-secondary px-1 py-0.5 rounded text-foreground">VITE_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"</code></li>
                  <li>Restart your development server</li>
                </ol>
                <div className="mt-4 pt-4 border-t border-rose-500/20">
                  <button 
                    onClick={() => login('')}
                    className="w-full py-2 bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 rounded-lg text-sm font-bold transition-colors"
                  >
                    Bypass Login (Dev Mode)
                  </button>
                </div>
              </div>
            ) : loading ? (
              <div className="w-full py-3 h-[40px] flex items-center justify-center text-sm font-bold text-muted-foreground bg-secondary/50 rounded-xl animate-pulse">
                Authenticating...
              </div>
            ) : (
              <div className="w-full flex justify-center hover:scale-[1.02] transition-transform duration-300">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google Sign In failed')}
                  useOneTap
                  theme="filled_black"
                  shape="rectangular"
                  size="large"
                  text="continue_with"
                />
              </div>
            )}
            
            <p className="text-xs font-medium text-muted-foreground/60 text-center mt-6">
              By continuing, you are securely authenticated by Google. Your data is protected constraint by Convex security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
