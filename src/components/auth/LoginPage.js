import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

const LoginPage = ({ onNavigate, onLogin, onGoogleLogin, onResendVerification }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [emailNeedsVerification, setEmailNeedsVerification] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setEmailNeedsVerification(false);
        try {
            await onLogin(email, password);
        } catch (err) {
            if (err.code === 'auth/email-not-verified') {
                setEmailNeedsVerification(true);
            } else {
                setError(err.message);
            }
        }
    };

    return (
        <div className="p-8 text-center min-h-[500px] flex flex-col justify-center items-center">
            <LogIn className="w-20 h-20 text-purple-400 mb-6" />
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-wide mb-4">
                Login
            </h2>
            <p className="text-gray-300 mb-6">Welcome back! Sign in to access your data.</p>
            {error && <div className="bg-red-800 bg-opacity-50 text-red-200 p-3 rounded-lg mb-4">{error}</div>}
            
            
            {emailNeedsVerification && (
                <div className="bg-yellow-800 bg-opacity-50 text-yellow-200 p-4 rounded-lg mb-4">
                    <p className="font-bold">Please verify your email address.</p>
                    <p className="text-sm mt-2">A verification email was sent. If you haven't received it, you can resend it below.</p>
                    <button
                        onClick={() => onResendVerification(email)}
                        className="mt-3 text-sm text-yellow-300 hover:text-yellow-100 underline"
                    >
                        Resend Verification Email
                    </button>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full p-3 rounded-xl bg-gray-700 border border-purple-600/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full p-3 rounded-xl bg-gray-700 border border-purple-600/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                    required
                />
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white p-3 rounded-xl shadow-lg hover:from-purple-700 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 active:scale-95 font-bold"
                >
                    Sign In
                </button>
            </form>
            <div className="mt-4 text-sm text-gray-400">
                Don't have an account? <button onClick={() => onNavigate('register')} className="text-purple-400 hover:text-purple-300">Register</button>
            </div>
            <div className="flex items-center my-6 w-full max-w-sm">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="flex-shrink mx-4 text-gray-400">OR</span>
                <div className="flex-grow border-t border-gray-600"></div>
            </div>
            <button
                onClick={onGoogleLogin}
                className="w-full max-w-sm flex items-center justify-center p-3 rounded-xl bg-gray-700 text-white shadow-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 active:scale-95 font-bold"
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-5 h-5 mr-3" />
                Sign in with Google
            </button>
        </div>
    );
};

export default LoginPage;