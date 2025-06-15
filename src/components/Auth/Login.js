// src/components/Auth/Login.jsx
import React, { useState } from 'react';
import { auth, db } from '../../firebase/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Link to the custom CSS

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const role = userDoc.data()?.role;

      localStorage.setItem('userId', user.uid);

      if (role === 'admin') {
        navigate('/admin-dashboard');
      } else if (role === 'herder') {
        navigate('/herder-dashboard');
      } else if (role === 'farmer') {
        navigate('/farmer-dashboard');
      } else {
        setError('Unknown role');
      }
    } catch (err) {
      setError('Invalid credentials or error occurred.');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
