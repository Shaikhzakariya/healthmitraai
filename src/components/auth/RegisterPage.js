import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';

const RegisterPage = ({ onNavigate, onRegister, onGoogleLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [verificationSent, setVerificationSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        try {
            await onRegister(email, password);
            setVerificationSent(true);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="p-8 text-center min-h-[500px] flex flex-col justify-center items-center">
            <UserPlus className="w-20 h-20 text-green-400 mb-6" />
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-wide mb-4">
                Register
            </h2>
            <p className="text-gray-300 mb-6">Create your account to start tracking your health.</p>
            {error && <div className="bg-red-800 bg-opacity-50 text-red-200 p-3 rounded-lg mb-4">{error}</div>}
            
            {verificationSent ? (
                <div className="text-center p-6 rounded-xl bg-gray-700 border border-green-500">
                    <p className="text-lg text-green-400 mb-3">Verification Email Sent!</p>
                    <p className="text-gray-300">Please check your inbox and click the verification link. You can then log in on the login page.</p>
                    <button onClick={() => onNavigate('login')} className="mt-4 text-purple-400 hover:text-purple-300">
                        Go to Login
                    </button>
                </div>
            ) : (
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
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        className="w-full p-3 rounded-xl bg-gray-700 border border-purple-600/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-600 to-teal-500 text-white p-3 rounded-xl shadow-lg hover:from-green-700 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 active:scale-95 font-bold"
                    >
                        Register
                    </button>
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
                        Sign up with Google
                    </button>
                </form>
            )}
        </div>
    );
};

export default RegisterPage;