import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getApiErrorMessage } from '../utils/errors';
const LegalScene3D = lazy(() => import('../components/LegalScene3D').then(m => ({ default: m.LegalScene3D })));
import { HiScale, HiMail, HiLockClosed, HiUser, HiSun, HiMoon, HiEye, HiEyeOff } from 'react-icons/hi';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    // Reset transient state when switching between Sign In / Sign Up.
    const switchMode = (loginMode) => {
        setIsLogin(loginMode);
        setError('');
        setSuccess('');
        setConfirmPassword('');
    };

    // Returns an error string if invalid, or null if the form is good to submit.
    const validate = () => {
        const trimmedEmail = email.trim();
        if (!EMAIL_RE.test(trimmedEmail)) {
            return 'Please enter a valid email address.';
        }
        if (!isLogin) {
            if (!fullName.trim()) {
                return 'Please enter your full name.';
            }
            if (password.length < MIN_PASSWORD_LENGTH) {
                return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
            }
            if (password !== confirmPassword) {
                return 'Passwords do not match.';
            }
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                await login(email.trim(), password);
                navigate('/dashboard');
            } else {
                await signup(fullName.trim(), email.trim(), password);
                // Switch to login tab and show success message
                setSuccess('Account created successfully! Please sign in.');
                setIsLogin(true);
                setFullName('');
                setPassword('');
                setConfirmPassword('');
            }
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${theme === 'dark'
            ? 'bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900'
            : 'bg-gradient-to-br from-primary-50 via-white to-gold-50'
            }`}>
            {/* Three.js Background - lazy loaded */}
            <Suspense fallback={null}>
                <LegalScene3D variant="full" />
            </Suspense>

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className={`absolute top-6 right-6 z-20 p-3 rounded-xl transition-all duration-300 ${theme === 'dark'
                    ? 'bg-dark-600/80 text-gold-400 hover:bg-dark-500/80'
                    : 'bg-white/80 text-primary-600 hover:bg-white'
                    } backdrop-blur-sm`}
                id="theme-toggle"
            >
                {theme === 'dark' ? <HiSun size={20} /> : <HiMoon size={20} />}
            </button>

            {/* Auth Card */}
            <div className={`relative z-10 w-full max-w-md mx-4 animate-fade-in-up`}>
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${theme === 'dark'
                        ? 'bg-gradient-to-br from-gold-500/20 to-gold-700/20 border border-gold-500/30'
                        : 'bg-gradient-to-br from-primary-100 to-primary-200 border border-primary-300'
                        }`}>
                        <HiScale className={`text-3xl ${theme === 'dark' ? 'text-gold-400' : 'text-primary-600'}`} />
                    </div>
                    <h1 className={`text-3xl font-bold font-[Playfair_Display] mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-800'
                        }`}>
                        NyayaVaad
                    </h1>
                    <p className={`text-sm tracking-widest uppercase ${theme === 'dark' ? 'text-gold-400/70' : 'text-primary-500'
                        }`}>
                        AI Legal Assistant
                    </p>
                </div>

                {/* Form Card */}
                <div className={`rounded-2xl p-8 ${theme === 'dark'
                    ? 'glass-dark glow-gold'
                    : 'glass-light shadow-xl shadow-primary-100/50'
                    }`}>
                    {/* Tab Switcher */}
                    <div className={`flex rounded-xl p-1 mb-6 ${theme === 'dark' ? 'bg-dark-700/50' : 'bg-gray-100'
                        }`}>
                        <button
                            onClick={() => switchMode(true)}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${isLogin
                                ? theme === 'dark'
                                    ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-dark-900 shadow-lg'
                                    : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                                : theme === 'dark'
                                    ? 'text-dark-200 hover:text-white'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            id="login-tab"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => switchMode(false)}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${!isLogin
                                ? theme === 'dark'
                                    ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-dark-900 shadow-lg'
                                    : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                                : theme === 'dark'
                                    ? 'text-dark-200 hover:text-white'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            id="signup-tab"
                        >
                            Sign Up
                        </button>
                    </div>

                    {success && (
                        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm animate-fade-in">
                            ✅ {success}
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="animate-fade-in">
                                <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 block ${theme === 'dark' ? 'text-dark-100' : 'text-gray-600'
                                    }`}>
                                    Full Name
                                </label>
                                <div className="relative">
                                    <HiUser className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-dark-300' : 'text-gray-400'
                                        }`} />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Advocate Kumar"
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-300 outline-none ${theme === 'dark'
                                            ? 'bg-dark-700/50 border border-dark-400/30 text-white placeholder-dark-300 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20'
                                            : 'bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-primary-400 focus:ring-1 focus:ring-primary-200'
                                            }`}
                                        id="fullname-input"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 block ${theme === 'dark' ? 'text-dark-100' : 'text-gray-600'
                                }`}>
                                Email Address
                            </label>
                            <div className="relative">
                                <HiMail className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-dark-300' : 'text-gray-400'
                                    }`} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="advocate@law.com"
                                    required
                                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-300 outline-none ${theme === 'dark'
                                        ? 'bg-dark-700/50 border border-dark-400/30 text-white placeholder-dark-300 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20'
                                        : 'bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-primary-400 focus:ring-1 focus:ring-primary-200'
                                        }`}
                                    id="email-input"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 block ${theme === 'dark' ? 'text-dark-100' : 'text-gray-600'
                                }`}>
                                Password
                            </label>
                            <div className="relative">
                                <HiLockClosed className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-dark-300' : 'text-gray-400'
                                    }`} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                    className={`w-full pl-10 pr-12 py-3 rounded-xl text-sm transition-all duration-300 outline-none ${theme === 'dark'
                                        ? 'bg-dark-700/50 border border-dark-400/30 text-white placeholder-dark-300 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20'
                                        : 'bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-primary-400 focus:ring-1 focus:ring-primary-200'
                                        }`}
                                    id="password-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-dark-300 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                                </button>
                            </div>
                            {!isLogin && (
                                <p className={`text-[10px] mt-1.5 ${theme === 'dark' ? 'text-dark-300' : 'text-gray-400'}`}>
                                    At least 8 characters.
                                </p>
                            )}
                        </div>

                        {!isLogin && (
                            <div className="animate-fade-in">
                                <label className={`text-xs font-semibold uppercase tracking-wider mb-1.5 block ${theme === 'dark' ? 'text-dark-100' : 'text-gray-600'
                                    }`}>
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <HiLockClosed className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-dark-300' : 'text-gray-400'
                                        }`} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm transition-all duration-300 outline-none ${theme === 'dark'
                                            ? 'bg-dark-700/50 border border-dark-400/30 text-white placeholder-dark-300 focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20'
                                            : 'bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-primary-400 focus:ring-1 focus:ring-primary-200'
                                            }`}
                                        id="confirm-password-input"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                                } ${theme === 'dark'
                                    ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-dark-900 hover:shadow-gold-500/20'
                                    : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-primary-500/30'
                                }`}
                            id="submit-btn"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : isLogin ? 'Sign In to NyayaVaad' : 'Create Account'}
                        </button>
                    </form>

                    <p className={`text-center text-xs mt-6 ${theme === 'dark' ? 'text-dark-200' : 'text-gray-500'
                        }`}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => switchMode(!isLogin)}
                            className={`font-semibold transition-colors ${theme === 'dark' ? 'text-gold-400 hover:text-gold-300' : 'text-primary-600 hover:text-primary-700'
                                }`}
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>

                {/* Footer */}
                <p className={`text-center text-xs mt-6 ${theme === 'dark' ? 'text-dark-300' : 'text-gray-400'
                    }`}>
                    🔒 Your consultations are private and encrypted
                </p>
            </div>
        </div>
    );
}
