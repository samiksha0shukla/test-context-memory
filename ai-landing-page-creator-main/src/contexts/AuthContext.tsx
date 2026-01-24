import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check localStorage for existing session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    // Mock authentication - in production, replace with actual auth
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = storedUsers.find((u: { email: string; password: string }) => 
      u.email === email && u.password === password
    );
    
    if (!foundUser) {
      return { error: 'Invalid email or password' };
    }

    const userSession = { name: foundUser.name, email: foundUser.email };
    setUser(userSession);
    localStorage.setItem('user', JSON.stringify(userSession));
    return {};
  };

  const signUp = async (name: string, email: string, password: string): Promise<{ error?: string }> => {
    // Mock registration - in production, replace with actual auth
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (storedUsers.find((u: { email: string }) => u.email === email)) {
      return { error: 'Email already registered' };
    }

    const newUser = { name, email, password };
    storedUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(storedUsers));

    const userSession = { name, email };
    setUser(userSession);
    localStorage.setItem('user', JSON.stringify(userSession));
    return {};
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
